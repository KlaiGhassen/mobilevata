import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { VehiclesRepository } from './vehicles.repository';
import { UsersRepository } from '../users/users.repository';
import { DealersRepository } from '../dealers/dealers.repository';
import {
  CreateVehicleDto,
  SearchVehiclesDto,
  UpdateVehicleDto,
} from './dto/search-vehicles.dto';
import { IVehiclesService } from '../../common/interfaces/tokens';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { serializeVehicle, toId } from '../../common/mappers/serialize';
import { CacheService } from '../../infrastructure/redis/redis.module';
import { ElasticsearchService } from '../../infrastructure/elasticsearch/elasticsearch.service';

const CATEGORIES = [
  {
    slug: 'family',
    titleKey: 'categories.family',
    filters: { yearMin: 2016, mileageMax: 150000, priceMax: 50000 },
  },
  {
    slug: 'first-car',
    titleKey: 'categories.firstCar',
    filters: { yearMin: 2010, priceMax: 7000 },
  },
  {
    slug: 'luxury',
    titleKey: 'categories.luxury',
    filters: { yearMin: 2018, priceMin: 35000, mileageMax: 80000 },
  },
  {
    slug: 'eco',
    titleKey: 'categories.eco',
    filters: {
      fuelType: 'electric',
      yearMin: 2020,
      mileageMax: 60000,
      priceMax: 28000,
    },
  },
  {
    slug: 'commute',
    titleKey: 'categories.commute',
    filters: { priceMin: 10000, priceMax: 25000, mileageMax: 100000 },
  },
  {
    slug: 'city',
    titleKey: 'categories.city',
    filters: { bodyType: 'city', priceMax: 15000 },
  },
];

@Injectable()
export class VehiclesService implements IVehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly vehicles: VehiclesRepository,
    private readonly users: UsersRepository,
    private readonly dealers: DealersRepository,
    private readonly cache: CacheService,
    private readonly es: ElasticsearchService,
    private readonly config: ConfigService,
  ) {}

  private allowedImageBase(): string {
    const endpoint =
      this.config.get<string>('MINIO_PUBLIC_URL') ||
      this.config.get<string>('MINIO_ENDPOINT') ||
      'http://127.0.0.1:9000';
    return endpoint.replace(/\/$/, '');
  }

  private assertAllowedImageUrls(urls: string[] | undefined) {
    if (!urls?.length) return;
    let base: URL;
    try {
      base = new URL(this.allowedImageBase());
    } catch {
      throw new BadRequestException('Image storage is misconfigured.');
    }
    const bucket =
      this.config.get<string>('MINIO_BUCKET') || 'autovia-vehicles';
    const pathPrefix = `/${bucket}/`;

    for (const raw of urls) {
      let parsed: URL;
      try {
        parsed = new URL(raw);
      } catch {
        throw new BadRequestException(
          'Image URLs must come from the Autovia upload service.',
        );
      }
      if (parsed.protocol !== base.protocol || parsed.host !== base.host) {
        throw new BadRequestException(
          'Image URLs must come from the Autovia upload service.',
        );
      }
      if (parsed.username || parsed.password) {
        throw new BadRequestException(
          'Image URLs must come from the Autovia upload service.',
        );
      }
      if (!parsed.pathname.startsWith(pathPrefix)) {
        throw new BadRequestException(
          'Image URLs must come from the Autovia upload service.',
        );
      }
    }
  }

  private cacheKey(query: SearchVehiclesDto) {
    return `search:${JSON.stringify(query)}`;
  }

  private toEsDoc(serialized: Record<string, unknown>) {
    const brand = serialized.brand as { id?: string; name?: string } | null;
    const model = serialized.model as { id?: string; name?: string } | null;
    return {
      id: serialized.id,
      title: serialized.title,
      description: serialized.description,
      brandId: brand?.id || serialized.brandId,
      modelId: model?.id || serialized.modelId,
      brandName: brand?.name || '',
      modelName: model?.name || '',
      price: serialized.price,
      year: serialized.year,
      mileage: serialized.mileage,
      fuelType: serialized.fuelType,
      transmission: serialized.transmission,
      bodyType: serialized.bodyType,
      country: serialized.country,
      condition: serialized.condition,
      color: serialized.color,
      sellersType: serialized.sellersType,
      categoryTags: serialized.categoryTags || [],
      published: serialized.published ?? true,
      createdAt: serialized.createdAt,
    };
  }

  async search(query: SearchVehiclesDto) {
    const key = this.cacheKey(query);
    const cached = await this.cache.getJson<Record<string, unknown>>(key);
    if (cached) return cached;

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;

    const esResult = await this.es.searchIds(query);
    let payload: Record<string, unknown>;

    if (esResult) {
      const docs = await Promise.all(
        esResult.ids.map((id) => this.vehicles.findPublishedById(id)),
      );
      const items = docs
        .filter(Boolean)
        .map((v) =>
          serializeVehicle(v!.toObject() as unknown as Record<string, unknown>),
        );
      // Preserve ES order
      const byId = new Map(items.map((i) => [i.id as string, i]));
      const ordered = esResult.ids
        .map((id) => byId.get(id))
        .filter(Boolean);
      payload = {
        ...paginateMeta(esResult.total, page, limit),
        items: ordered,
        source: 'elasticsearch',
      };
    } else {
      const result = await this.vehicles.search(query);
      payload = {
        ...paginateMeta(result.total, result.page, result.limit),
        items: result.items.map((v) =>
          serializeVehicle(v.toObject() as unknown as Record<string, unknown>),
        ),
        source: 'mongodb',
      };
    }

    await this.cache.setJson(key, payload, 45);
    return payload;
  }

  async findOne(id: string) {
    const cacheKey = `vehicle:${id}`;
    const cached = await this.cache.getJson<Record<string, unknown>>(cacheKey);
    if (cached) {
      void this.vehicles.incrementViews(id);
      return cached;
    }
    const vehicle = await this.vehicles.findPublishedById(id);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    await this.vehicles.incrementViews(id);
    const serialized = serializeVehicle(
      vehicle.toObject() as unknown as Record<string, unknown>,
    );
    await this.cache.setJson(cacheKey, serialized, 30);
    return serialized;
  }

  async create(userId: string, dto: CreateVehicleDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new ForbiddenException();
    if (user.status && user.status !== 'ACTIVE') {
      throw new ForbiddenException('Suspended accounts cannot list vehicles');
    }
    const dealer = await this.dealers.findOne({ userId: user._id });

    this.assertAllowedImageUrls(dto.images);

    const vehicle = await this.vehicles.create({
      ...dto,
      condition: dto.condition || 'used',
      country: dto.country || 'Germany',
      features: dto.features || [],
      images: dto.images?.length ? dto.images : [],
      categoryTags: dto.categoryTags || [],
      sellersType: user.role === 'DEALER' ? 'PRO' : 'PRIVATE',
      sellerId: new Types.ObjectId(userId),
      dealerId: dealer?._id,
      brandId: new Types.ObjectId(dto.brandId),
      modelId: new Types.ObjectId(dto.modelId),
    });

    const populated = await this.vehicles.findPublishedById(
      vehicle._id.toString(),
    );
    const serialized = serializeVehicle(
      (populated || vehicle).toObject() as unknown as Record<string, unknown>,
    );
    await this.es.indexVehicle(this.toEsDoc(serialized));
    await this.cache.del('search:*');
    await this.cache.del('stats');
    return serialized;
  }

  async update(userId: string, id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new NotFoundException();
    if (vehicle.sellerId.toString() !== userId) throw new ForbiddenException();

    this.assertAllowedImageUrls(dto.images);

    // Sellers cannot toggle visibility — admin moderation owns published.
    const { published: _published, ...safeDto } = dto as UpdateVehicleDto & {
      published?: boolean;
    };
    const patch: Record<string, unknown> = { ...safeDto };
    if (dto.brandId) patch.brandId = new Types.ObjectId(dto.brandId);
    if (dto.modelId) patch.modelId = new Types.ObjectId(dto.modelId);
    delete patch.published;

    const updated = await this.vehicles.updateById(id, { $set: patch });
    if (!updated) throw new NotFoundException();

    const populated =
      (await this.vehicles.findPublishedById(id)) ||
      (await this.vehicles.findById(id));
    const serialized = serializeVehicle(
      populated!.toObject() as unknown as Record<string, unknown>,
    );
    if (serialized.published !== false) {
      await this.es.indexVehicle(this.toEsDoc(serialized));
    } else {
      await this.es.deleteVehicle(id);
    }
    await this.cache.del('search:*');
    await this.cache.del(`vehicle:${id}`);
    await this.cache.del('stats');
    return serialized;
  }

  async myVehicles(userId: string) {
    const items = await this.vehicles.findMany(
      { sellerId: new Types.ObjectId(userId) },
      {
        sort: { createdAt: -1 },
        populate: ['brandId', 'modelId'],
      },
    );
    return items.map((v) =>
      serializeVehicle(v.toObject() as unknown as Record<string, unknown>),
    );
  }

  async remove(userId: string, id: string) {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new NotFoundException();
    if (vehicle.sellerId.toString() !== userId) throw new ForbiddenException();
    await this.vehicles.deleteById(id);
    await this.es.deleteVehicle(id);
    await this.cache.del('search:*');
    await this.cache.del(`vehicle:${id}`);
    await this.cache.del('stats');
    return { ok: true };
  }

  async stats() {
    const cached = await this.cache.getJson<Record<string, unknown>>('stats');
    if (cached) return cached;
    const stats = await this.vehicles.aggregateStats();
    await this.cache.setJson('stats', stats, 120);
    return stats;
  }

  categories() {
    return CATEGORIES;
  }

  /** Reindex all published vehicles into Elasticsearch */
  async reindexAll() {
    const items = await this.vehicles.findMany(
      { published: true },
      { populate: ['brandId', 'modelId'] },
    );
    const docs = items.map((v) =>
      this.toEsDoc(
        serializeVehicle(v.toObject() as unknown as Record<string, unknown>),
      ),
    );
    await this.es.bulkIndex(docs);
    this.logger.log(`Reindexed ${docs.length} vehicles into Elasticsearch`);
    return { indexed: docs.length };
  }
}
