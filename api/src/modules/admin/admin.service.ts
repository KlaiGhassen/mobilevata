import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { DealersRepository } from '../dealers/dealers.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { BrandsRepository } from '../brands/brands.repository';
import { ReclamationsService } from '../reclamations/reclamations.service';
import { ReclamationsRepository } from '../reclamations/reclamations.repository';
import { CacheService } from '../../infrastructure/redis/redis.module';
import { ElasticsearchService } from '../../infrastructure/elasticsearch/elasticsearch.service';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { serializeEntity, serializeVehicle, toId } from '../../common/mappers/serialize';
import { escapeRegExp } from '../../common/security/escape';
import { isStaffRole, isSuperAdmin } from '../../common/security/roles';
import { VehicleModel } from '../../database/schemas/brand.schema';
import {
  Conversation,
  ChatMessage,
  ConversationStatus,
} from '../../database/schemas/chat.schema';
import { Favorite } from '../../database/schemas/engagement.schema';
import { ReclamationDocument } from '../../database/schemas/reclamation.schema';
import { UserDocument } from '../../database/schemas/user.schema';
import {
  CreateAdminUserDto,
  CreateBrandDto,
  ListAdminVehiclesDto,
  ListBrandsDto,
  ListDealersDto,
  ListUsersDto,
  UpdateAdminUserDto,
  UpdateAdminVehicleDto,
  UpdateBrandDto,
  UpdateDealerDto,
} from './dto/admin.dto';
import {
  ListReclamationsDto,
  UpdateReclamationDto,
} from '../reclamations/dto/reclamation.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly users: UsersRepository,
    private readonly dealers: DealersRepository,
    private readonly vehicles: VehiclesRepository,
    private readonly brandsRepo: BrandsRepository,
    private readonly reclamations: ReclamationsService,
    private readonly reclamationsRepo: ReclamationsRepository,
    private readonly cache: CacheService,
    private readonly es: ElasticsearchService,
    private readonly config: ConfigService,
    @InjectModel(VehicleModel.name)
    private readonly models: Model<VehicleModel>,
    @InjectModel(Conversation.name)
    private readonly conversations: Model<Conversation>,
    @InjectModel(ChatMessage.name)
    private readonly chatMessages: Model<ChatMessage>,
    @InjectModel(Favorite.name)
    private readonly favorites: Model<Favorite>,
  ) {}

  private serializeUser(doc: { toObject: () => object }) {
    const o = doc.toObject() as unknown as Record<string, unknown>;
    return {
      id: toId(o._id),
      email: o.email,
      firstName: o.firstName,
      lastName: o.lastName,
      phone: o.phone,
      role: o.role,
      // Mongoose defaults apply in-memory; older docs may omit status in Mongo.
      status: (o.status as string) || 'ACTIVE',
      moderationReason: o.moderationReason,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  /** Treat missing/null status as ACTIVE (legacy documents). */
  private userStatusFilter(status: string): Record<string, unknown> {
    if (status === 'ACTIVE') {
      return {
        $or: [
          { status: 'ACTIVE' },
          { status: { $exists: false } },
          { status: null },
        ],
      };
    }
    return { status };
  }

  /** Mirror of the vehicle→Elasticsearch mapping used by the public service. */
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

  async getStats() {
    const cached = await this.cache.getJson<Record<string, unknown>>(
      'admin:stats',
    );
    if (cached) return cached;

    const [
      userTotal,
      userActive,
      userSuspended,
      userBanned,
      vehicleTotal,
      vehiclePublished,
      dealerTotal,
      dealerVerified,
      reclamationTotal,
      openReclamations,
      conversationTotal,
      conversationPending,
      messageTotal,
      favoriteTotal,
      recentReclamations,
      recentUsers,
    ] = await Promise.all([
      this.users.count({}),
      this.users.count(this.userStatusFilter('ACTIVE')),
      this.users.count(this.userStatusFilter('SUSPENDED')),
      this.users.count(this.userStatusFilter('BANNED')),
      this.vehicles.count({}),
      this.vehicles.count({ published: true }),
      this.dealers.count({}),
      this.dealers.count({ verified: true }),
      this.reclamationsRepo.count({}),
      this.reclamationsRepo.count({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      this.conversations.countDocuments().exec(),
      this.conversations
        .countDocuments({ status: ConversationStatus.PENDING })
        .exec(),
      this.chatMessages.countDocuments().exec(),
      this.favorites.countDocuments().exec(),
      this.reclamationsRepo.findMany(
        {},
        {
          sort: { createdAt: -1 },
          limit: 6,
          populate: {
            path: 'reporterId',
            select: 'firstName lastName email',
          },
        },
      ),
      this.users.findMany(
        {},
        { sort: { createdAt: -1 }, limit: 6 },
      ),
    ]);

    const reclamationStatuses = await this.reclamations.statusBreakdown();
    const roleCounts = await this.users
      .findMany({})
      .then((docs) => {
        const counts: Record<string, number> = {
          USER: 0,
          DEALER: 0,
          ADMIN: 0,
          SUPER_ADMIN: 0,
        };
        for (const d of docs) {
          const role = (d.toObject() as { role: string }).role;
          if (role in counts) counts[role] += 1;
        }
        return counts;
      });

    const stats = {
      users: {
        total: userTotal,
        active: userActive,
        suspended: userSuspended,
        banned: userBanned,
        byRole: roleCounts,
      },
      vehicles: {
        total: vehicleTotal,
        published: vehiclePublished,
        unpublished: vehicleTotal - vehiclePublished,
      },
      dealers: {
        total: dealerTotal,
        verified: dealerVerified,
        unverified: dealerTotal - dealerVerified,
      },
      reclamations: {
        total: reclamationTotal,
        pending: openReclamations,
        byStatus: reclamationStatuses,
      },
      conversations: {
        total: conversationTotal,
        pending: conversationPending,
      },
      messages: { total: messageTotal },
      favorites: { total: favoriteTotal },
      recentReclamations: recentReclamations.map((r: ReclamationDocument) =>
        this.serializeReclamationPreview(r),
      ),
      recentUsers: recentUsers.map((u: UserDocument) => this.serializeUser(u)),
    };

    await this.cache.setJson('admin:stats', stats, 60);
    return stats;
  }

  private serializeReclamationPreview(doc: { toObject: () => object }) {
    const o = doc.toObject() as unknown as Record<string, unknown>;
    const reporter = o.reporterId as
      | { firstName?: string; lastName?: string; email?: string }
      | null
      | undefined;
    return {
      id: toId(o._id),
      title: o.title,
      status: o.status,
      priority: o.priority,
      targetType: o.targetType,
      targetId: o.targetId,
      createdAt: o.createdAt,
      reporterName:
        reporter && reporter.firstName
          ? `${reporter.firstName} ${reporter.lastName ?? ''}`.trim()
          : null,
    };
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  async listUsers(query: ListUsersDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const and: Record<string, unknown>[] = [];
    if (query.role) and.push({ role: query.role });
    if (query.status) and.push(this.userStatusFilter(query.status));
    if (query.q) {
      const rx = new RegExp(escapeRegExp(query.q), 'i');
      and.push({
        $or: [{ email: rx }, { firstName: rx }, { lastName: rx }],
      });
    }
    const filter: Record<string, unknown> = and.length ? { $and: and } : {};
    const sort: Record<string, 1 | -1> =
      query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [total, items] = await Promise.all([
      this.users.count(filter),
      this.users.findMany(filter, {
        skip: (page - 1) * limit,
        limit,
        sort,
      }),
    ]);
    return {
      ...paginateMeta(total, page, limit),
      items: items.map((u) => this.serializeUser(u)),
    };
  }

  async getUser(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const [dealer, vehicleTotal, vehiclePublished] = await Promise.all([
      this.dealers.findOne({ userId: user._id }),
      this.vehicles.count({ sellerId: user._id }),
      this.vehicles.count({ sellerId: user._id, published: true }),
    ]);

    const recentVehicles = await this.vehicles.findMany(
      { sellerId: user._id },
      {
        sort: { createdAt: -1 },
        limit: 8,
        populate: ['brandId', 'modelId'],
      },
    );

    return {
      ...this.serializeUser(user),
      stats: {
        vehicles: vehicleTotal,
        publishedVehicles: vehiclePublished,
      },
      dealer: dealer
        ? serializeEntity(
            dealer.toObject() as unknown as Record<string, unknown>,
          )
        : null,
      recentVehicles: recentVehicles.map((v) => {
        const o = v.toObject() as unknown as Record<string, unknown>;
        const brand = o.brandId as { name?: string } | null;
        const model = o.modelId as { name?: string } | null;
        return {
          id: toId(o._id),
          title: o.title,
          price: o.price,
          currency: o.currency,
          year: o.year,
          published: o.published,
          images: (o.images as string[]) ?? [],
          brandName: brand?.name ?? null,
          modelName: model?.name ?? null,
          createdAt: o.createdAt,
        };
      }),
    };
  }

  async createAdminUser(actorId: string, dto: CreateAdminUserDto) {
    const actor = await this.users.findById(actorId);
    if (!actor || !isSuperAdmin(actor.role)) {
      throw new ForbiddenException('Only a super admin can create admins');
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone?.trim() || undefined,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    await this.cache.del('admin:stats');
    return this.serializeUser(user);
  }

  async updateUser(adminId: string, userId: string, dto: UpdateAdminUserDto) {
    if (userId === adminId) {
      throw new ForbiddenException('You cannot modify your own account');
    }
    const actor = await this.users.findById(adminId);
    if (!actor) throw new ForbiddenException();

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (isSuperAdmin(user.role)) {
      throw new ForbiddenException('Super admin accounts cannot be modified');
    }

    if (isStaffRole(user.role) && !isSuperAdmin(actor.role)) {
      throw new ForbiddenException(
        'Only a super admin can modify administrator accounts',
      );
    }

    if (dto.role === 'ADMIN' && !isSuperAdmin(actor.role)) {
      throw new ForbiddenException('Only a super admin can grant admin access');
    }

    if (dto.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot assign the super admin role');
    }

    const patch: Record<string, unknown> = {};
    if (dto.role) patch.role = dto.role;
    if (dto.status) {
      patch.status = dto.status;
      if (dto.status !== 'ACTIVE') {
        patch.moderationReason =
          dto.moderationReason ?? `Moderated to ${dto.status}`;
      } else {
        patch.moderationReason = dto.moderationReason ?? null;
      }
    }

    await this.users.updateById(userId, { $set: patch });
    await this.cache.del('admin:stats');

    // Keep dealer linkage consistent when a user is demoted from DEALER.
    if (dto.role && dto.role !== 'DEALER') {
      await this.dealers.deleteMany({ userId: new Types.ObjectId(userId) });
    }
    if (dto.role === 'DEALER') {
      const existing = await this.dealers.findOne({ userId: user._id });
      if (!existing) {
        await this.dealers.create({
          userId: user._id,
          name: `${user.firstName} ${user.lastName}`.trim() || 'Dealer',
          country: 'Germany',
        });
      }
    }

    const updated = await this.users.findById(userId);
    if (!updated) throw new NotFoundException('User not found');
    return this.serializeUser(updated);
  }

  // ─── Vehicles ────────────────────────────────────────────────────────────

  async listVehicles(query: ListAdminVehiclesDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const filter: Record<string, unknown> = {};
    if (query.published !== undefined) filter.published = query.published;
    if (query.sellersType) filter.sellersType = query.sellersType;
    if (query.brandId) filter.brandId = new Types.ObjectId(query.brandId);
    if (query.q) {
      const rx = new RegExp(escapeRegExp(query.q), 'i');
      filter.$or = [{ title: rx }, { description: rx }];
    }

    const sort: Record<string, 1 | -1> =
      query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [total, items] = await Promise.all([
      this.vehicles.count(filter),
      this.vehicles.findMany(filter, {
        skip: (page - 1) * limit,
        limit,
        sort,
        populate: ['brandId', 'modelId', 'sellerId', 'dealerId'],
      }),
    ]);

    return {
      ...paginateMeta(total, page, limit),
      items: items.map((v) => {
        const o = v.toObject() as unknown as Record<string, unknown>;
        const brand = o.brandId as { name?: string } | null;
        const model = o.modelId as { name?: string } | null;
        const seller = o.sellerId as
          | { firstName?: string; lastName?: string; email?: string }
          | null;
        return {
          id: toId(o._id),
          title: o.title,
          price: o.price,
          currency: o.currency,
          year: o.year,
          mileage: o.mileage,
          fuelType: o.fuelType,
          transmission: o.transmission,
          bodyType: o.bodyType,
          condition: o.condition,
          sellersType: o.sellersType,
          published: o.published,
          moderationReason: o.moderationReason,
          views: o.views,
          images: o.images ?? [],
          createdAt: o.createdAt,
          brandName: brand?.name ?? null,
          modelName: model?.name ?? null,
          sellerName: seller
            ? `${seller.firstName ?? ''} ${seller.lastName ?? ''}`.trim()
            : null,
        };
      }),
    };
  }

  async getVehicle(id: string) {
    const vehicle = await this.vehicles.findMany(
      { _id: new Types.ObjectId(id) },
      {
        limit: 1,
        populate: ['brandId', 'modelId', 'sellerId', 'dealerId'],
      },
    );
    const doc = vehicle[0];
    if (!doc) throw new NotFoundException('Vehicle not found');

    const o = doc.toObject() as unknown as Record<string, unknown>;
    const brand = o.brandId as
      | { _id?: unknown; name?: string; logoUrl?: string }
      | null;
    const model = o.modelId as { _id?: unknown; name?: string } | null;
    const seller = o.sellerId as
      | {
          _id?: unknown;
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string;
          role?: string;
          status?: string;
        }
      | null;
    const dealer = o.dealerId as
      | {
          _id?: unknown;
          name?: string;
          city?: string;
          country?: string;
          verified?: boolean;
          phone?: string;
        }
      | null;

    return {
      id: toId(o._id),
      title: o.title,
      description: o.description ?? null,
      price: o.price,
      currency: o.currency,
      year: o.year,
      mileage: o.mileage,
      fuelType: o.fuelType,
      transmission: o.transmission,
      bodyType: o.bodyType,
      powerHp: o.powerHp ?? null,
      powerKw: o.powerKw ?? null,
      doors: o.doors ?? null,
      seats: o.seats ?? null,
      color: o.color ?? null,
      interiorColor: o.interiorColor ?? null,
      condition: o.condition,
      country: o.country,
      city: o.city ?? null,
      postalCode: o.postalCode ?? null,
      features: (o.features as string[]) ?? [],
      images: (o.images as string[]) ?? [],
      categoryTags: (o.categoryTags as string[]) ?? [],
      hasServiceBook: Boolean(o.hasServiceBook),
      hasWarranty: Boolean(o.hasWarranty),
      accidentFree: Boolean(o.accidentFree),
      sellersType: o.sellersType,
      electricRangeKm: o.electricRangeKm ?? null,
      co2Emissions: o.co2Emissions ?? null,
      consumption: o.consumption ?? null,
      vatDeductible: Boolean(o.vatDeductible),
      published: o.published,
      moderationReason: o.moderationReason ?? null,
      views: o.views ?? 0,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      brand: brand
        ? {
            id: toId(brand._id),
            name: brand.name ?? null,
            logoUrl: brand.logoUrl ?? null,
          }
        : null,
      model: model
        ? { id: toId(model._id), name: model.name ?? null }
        : null,
      seller: seller
        ? {
            id: toId(seller._id),
            firstName: seller.firstName ?? '',
            lastName: seller.lastName ?? '',
            email: seller.email ?? null,
            phone: seller.phone ?? null,
            role: seller.role ?? null,
            status: seller.status ?? null,
          }
        : null,
      dealer: dealer
        ? {
            id: toId(dealer._id),
            name: dealer.name ?? null,
            city: dealer.city ?? null,
            country: dealer.country ?? null,
            verified: Boolean(dealer.verified),
            phone: dealer.phone ?? null,
          }
        : null,
    };
  }

  async updateVehicle(id: string, dto: UpdateAdminVehicleDto) {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const patch: Record<string, unknown> = {};
    if (dto.published !== undefined) patch.published = dto.published;
    if (dto.moderationReason !== undefined) {
      patch.moderationReason = dto.moderationReason;
    }
    await this.vehicles.updateById(id, { $set: patch });

    if (dto.published !== undefined) {
      if (dto.published) {
        const populated =
          (await this.vehicles.findPublishedById(id)) ||
          (await this.vehicles.findById(id));
        if (populated) {
          const serialized = serializeVehicle(
            populated.toObject() as unknown as Record<string, unknown>,
          );
          await this.es.indexVehicle(this.toEsDoc(serialized));
        }
      } else {
        await this.es.deleteVehicle(id);
      }
      await this.cache.del('search:*');
      await this.cache.del(`vehicle:${id}`);
      await this.cache.del('stats');
    }
    await this.cache.del('admin:stats');

    const updated = await this.vehicles.findById(id);
    return {
      id,
      published: updated?.published ?? dto.published,
      moderationReason: updated?.moderationReason ?? null,
    };
  }

  async deleteVehicle(id: string) {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    await this.vehicles.deleteById(id);
    await this.es.deleteVehicle(id);
    await this.cache.del('search:*');
    await this.cache.del(`vehicle:${id}`);
    await this.cache.del('stats');
    await this.cache.del('admin:stats');
    return { ok: true, id };
  }

  // ─── Dealers ─────────────────────────────────────────────────────────────

  async listDealers(query: ListDealersDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const filter: Record<string, unknown> = {};
    if (query.verified !== undefined) filter.verified = query.verified;
    if (query.q) {
      const rx = new RegExp(escapeRegExp(query.q), 'i');
      filter.$or = [{ name: rx }, { city: rx }, { description: rx }];
    }
    const sort: Record<string, 1 | -1> =
      query.sort === 'oldest' ? { createdAt: 1 } : { rating: -1 };

    const [total, items] = await Promise.all([
      this.dealers.count(filter),
      this.dealers.findMany(filter, {
        skip: (page - 1) * limit,
        limit,
        sort,
        populate: { path: 'userId', select: 'firstName lastName email status' },
      }),
    ]);

    return {
      ...paginateMeta(total, page, limit),
      items: items.map((d) => {
        const o = d.toObject() as unknown as Record<string, unknown>;
        const owner = o.userId as
          | { firstName?: string; lastName?: string; email?: string; status?: string }
          | null;
        const entity = serializeEntity(o) as Record<string, unknown>;
        delete entity.userId;
        return {
          ...entity,
          ownerEmail: owner?.email ?? null,
          ownerName: owner
            ? `${owner.firstName ?? ''} ${owner.lastName ?? ''}`.trim()
            : null,
          ownerStatus: owner?.status ?? null,
        };
      }),
    };
  }

  async updateDealer(id: string, dto: UpdateDealerDto) {
    const dealer = await this.dealers.findById(id);
    if (!dealer) throw new NotFoundException('Dealer not found');
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) patch[key] = value;
    }
    await this.dealers.updateById(id, { $set: patch });
    await this.cache.del('admin:stats');
    const updated = await this.dealers.findById(id);
    return serializeEntity(
      updated!.toObject() as unknown as Record<string, unknown>,
    );
  }

  async deleteDealer(id: string) {
    const dealer = await this.dealers.findById(id);
    if (!dealer) throw new NotFoundException('Dealer not found');
    await this.dealers.deleteById(id);
    // Demote the linked user so they cannot act as a dealer anymore.
    const owner = await this.users.findById(dealer.userId.toString());
    if (owner) {
      await this.users.updateById(owner._id.toString(), {
        $set: { role: 'USER' },
      });
    }
    await this.cache.del('admin:stats');
    return { ok: true, id };
  }

  // ─── Brands ──────────────────────────────────────────────────────────────

  private assertBrandLogoUrl(raw?: string | null) {
    if (raw === undefined || raw === null || raw === '') return null;
    const value = raw.trim();
    if (/^\/brands\/[a-z0-9._-]+\.(png|jpe?g|webp|svg)$/i.test(value)) {
      return value;
    }
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new BadRequestException(
        'logoUrl must be a /brands/… path or an Autovia upload URL',
      );
    }
    const publicBase =
      this.config.get<string>('MINIO_PUBLIC_URL') ||
      this.config.get<string>('MINIO_ENDPOINT') ||
      'http://127.0.0.1:9000';
    let base: URL;
    try {
      base = new URL(publicBase);
    } catch {
      throw new BadRequestException('Image storage is misconfigured.');
    }
    const bucket =
      this.config.get<string>('MINIO_BUCKET') || 'autovia-vehicles';
    if (
      parsed.protocol !== base.protocol ||
      parsed.host !== base.host ||
      parsed.username ||
      parsed.password ||
      !parsed.pathname.startsWith(`/${bucket}/`)
    ) {
      throw new BadRequestException(
        'logoUrl must be a /brands/… path or an Autovia upload URL',
      );
    }
    return value;
  }

  async listBrands(query: ListBrandsDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const filter: Record<string, unknown> = {};
    if (query.q?.trim()) {
      filter.name = new RegExp(escapeRegExp(query.q.trim()), 'i');
    }
    if (query.popular !== undefined) {
      filter.popular = query.popular;
    }

    const sort: Record<string, 1 | -1> =
      query.sort === 'newest'
        ? { createdAt: -1 }
        : query.sort === 'popular'
          ? { popular: -1, name: 1 }
          : { name: 1 };

    const [total, brands] = await Promise.all([
      this.brandsRepo.count(filter),
      this.brandsRepo.findMany(filter, {
        skip: (page - 1) * limit,
        limit,
        sort,
      }),
    ]);

    const ids = brands.map((b) => b._id);
    const modelCounts = ids.length
      ? await this.models.aggregate([
          { $match: { brandId: { $in: ids } } },
          { $group: { _id: '$brandId', count: { $sum: 1 } } },
        ])
      : [];
    const countByBrand = new Map(
      modelCounts.map((m) => [String(m._id), m.count as number]),
    );

    return {
      ...paginateMeta(total, page, limit),
      items: brands.map((b) => {
        const o = b.toObject() as unknown as Record<string, unknown>;
        return {
          ...serializeEntity(o),
          _count: { models: countByBrand.get(toId(o._id)) ?? 0 },
        };
      }),
    };
  }

  async createBrand(dto: CreateBrandDto) {
    const existing = await this.brandsRepo.findOne({ name: dto.name.trim() });
    if (existing) {
      throw new ConflictException('Brand already exists');
    }
    const logoUrl = this.assertBrandLogoUrl(dto.logoUrl);
    const brand = await this.brandsRepo.create({
      name: dto.name.trim(),
      popular: dto.popular ?? false,
      ...(logoUrl ? { logoUrl } : {}),
    });
    return {
      ...serializeEntity(brand.toObject() as unknown as Record<string, unknown>),
      _count: { models: 0 },
    };
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const brand = await this.brandsRepo.findById(id);
    if (!brand) throw new NotFoundException('Brand not found');
    if (dto.name) {
      const dup = await this.brandsRepo.findOne({
        name: dto.name.trim(),
        _id: { $ne: new Types.ObjectId(id) },
      });
      if (dup) throw new ConflictException('Brand already exists');
    }
    const patch: Record<string, unknown> = {};
    if (dto.name) patch.name = dto.name.trim();
    if (dto.popular !== undefined) patch.popular = dto.popular;
    if (dto.logoUrl !== undefined) {
      patch.logoUrl = this.assertBrandLogoUrl(dto.logoUrl);
    }
    await this.brandsRepo.updateById(id, { $set: patch });
    await this.cache.del('admin:stats');
    const updated = await this.brandsRepo.findById(id);
    const modelCount = await this.models.countDocuments({
      brandId: new Types.ObjectId(id),
    });
    return {
      ...serializeEntity(
        updated!.toObject() as unknown as Record<string, unknown>,
      ),
      _count: { models: modelCount },
    };
  }

  async deleteBrand(id: string) {
    const brand = await this.brandsRepo.findById(id);
    if (!brand) throw new NotFoundException('Brand not found');
    const modelCount = await this.models.countDocuments({
      brandId: new Types.ObjectId(id),
    });
    if (modelCount > 0) {
      throw new BadRequestException(
        'Cannot delete a brand that still has models assigned',
      );
    }
    await this.brandsRepo.deleteById(id);
    await this.cache.del('admin:stats');
    return { ok: true, id };
  }

  // ─── Reclamations (delegated, admin scoped) ──────────────────────────────

  async listReclamations(query: ListReclamationsDto) {
    return this.reclamations.adminList(query);
  }

  async getReclamation(id: string) {
    return this.reclamations.adminGet(id);
  }

  async updateReclamation(id: string, dto: UpdateReclamationDto, adminId: string) {
    return this.reclamations.adminUpdate(id, dto, adminId);
  }
}
