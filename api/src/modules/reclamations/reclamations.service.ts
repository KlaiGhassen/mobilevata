import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReclamationsRepository } from './reclamations.repository';
import { UsersRepository } from '../users/users.repository';
import { DealersRepository } from '../dealers/dealers.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { ElasticsearchService } from '../../infrastructure/elasticsearch/elasticsearch.service';
import { CacheService } from '../../infrastructure/redis/redis.module';
import { paginateMeta } from '../../common/dto/pagination.dto';
import { toId } from '../../common/mappers/serialize';
import { publicUser } from '../../common/mappers/public-user';
import {
  ReclamationDocument,
  ModerationAction,
  ReclamationStatus,
  ReclamationTargetType,
} from '../../database/schemas/reclamation.schema';
import { escapeRegExp } from '../../common/security/escape';
import {
  CreateReclamationDto,
  ListReclamationsDto,
  UpdateReclamationDto,
} from './dto/reclamation.dto';

@Injectable()
export class ReclamationsService {
  constructor(
    private readonly reclamations: ReclamationsRepository,
    private readonly users: UsersRepository,
    private readonly dealers: DealersRepository,
    private readonly vehicles: VehiclesRepository,
    private readonly es: ElasticsearchService,
    private readonly cache: CacheService,
  ) {}

  private serialize(doc: ReclamationDocument) {
    const o = doc.toObject() as unknown as Record<string, unknown>;
    return {
      id: toId(o._id),
      targetType: o.targetType,
      targetId: o.targetId,
      category: o.category,
      title: o.title,
      description: o.description,
      status: o.status,
      priority: o.priority,
      resolutionNote: o.resolutionNote,
      resolution: o.resolution,
      moderationAction: o.moderationAction,
      resolvedAt: o.resolvedAt,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      reporterId: toId(o.reporterId),
      assigneeId: o.assigneeId ? toId(o.assigneeId) : null,
      resolvedBy: o.resolvedBy ? toId(o.resolvedBy) : null,
      reporter: publicUser(o.reporterId) ?? undefined,
      assignee: publicUser(o.assigneeId) ?? undefined,
      resolvedByUser: publicUser(o.resolvedBy) ?? undefined,
    };
  }

  /** Validate that the reported target actually exists. */
  private async assertTargetExists(
    targetType: ReclamationTargetType,
    targetId: string,
  ) {
    if (targetType === ReclamationTargetType.VEHICLE) {
      const vehicle = await this.vehicles.findById(targetId);
      if (!vehicle) throw new NotFoundException('Reported vehicle not found');
    } else if (targetType === ReclamationTargetType.USER) {
      const user = await this.users.findById(targetId);
      if (!user) throw new NotFoundException('Reported user not found');
    } else if (targetType === ReclamationTargetType.DEALER) {
      const dealer = await this.dealers.findById(targetId);
      if (!dealer) throw new NotFoundException('Reported dealer not found');
    }
  }

  async create(userId: string, dto: CreateReclamationDto) {
    await this.assertTargetExists(dto.targetType, dto.targetId);

    const doc = await this.reclamations.create({
      reporterId: new Types.ObjectId(userId),
      targetType: dto.targetType,
      targetId: dto.targetId,
      category: dto.category,
      title: dto.title.trim(),
      description: dto.description.trim(),
    });

    await this.cache.del('admin:stats');
    return this.serialize(
      await doc.populate('reporterId', 'firstName lastName email'),
    );
  }

  async listMine(userId: string) {
    const items = await this.reclamations.findMany(
      { reporterId: new Types.ObjectId(userId) },
      { sort: { createdAt: -1 }, limit: 100 },
    );
    return items.map((r) => this.serialize(r));
  }

  async adminList(query: ListReclamationsDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.category) filter.category = query.category;
    if (query.targetType) filter.targetType = query.targetType;
    if (query.assigneeId) filter.assigneeId = new Types.ObjectId(query.assigneeId);
    if (query.q) {
      filter.$or = [
        { title: new RegExp(escapeRegExp(query.q), 'i') },
        { description: new RegExp(escapeRegExp(query.q), 'i') },
        { targetId: query.q },
      ];
    }

    const sort: Record<string, 1 | -1> =
      query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const [total, items] = await Promise.all([
      this.reclamations.count(filter),
      this.reclamations.findMany(filter, {
        skip: (page - 1) * limit,
        limit,
        sort,
        populate: [
          { path: 'reporterId', select: 'firstName lastName email role status' },
          { path: 'assigneeId', select: 'firstName lastName email role status' },
          { path: 'resolvedBy', select: 'firstName lastName email role status' },
        ],
      }),
    ]);

    return {
      ...paginateMeta(total, page, limit),
      items: items.map((r) => this.serialize(r)),
    };
  }

  async adminGet(id: string) {
    const doc = await this.reclamations.findById(id);
    if (!doc) throw new NotFoundException('Reclamation not found');

    await doc.populate([
      { path: 'reporterId', select: 'firstName lastName email role status' },
      { path: 'assigneeId', select: 'firstName lastName email' },
      { path: 'resolvedBy', select: 'firstName lastName email' },
    ]);

    const item = this.serialize(doc);

    // Attach a compact snapshot of the reported target for the admin detail view.
    const snapshot = await this.resolveTargetSnapshot(
      item.targetType as ReclamationTargetType,
      String(item.targetId),
    );
    return { ...item, target: snapshot };
  }

  async adminUpdate(
    id: string,
    dto: UpdateReclamationDto,
    adminId: string,
  ) {
    const doc = await this.reclamations.findById(id);
    if (!doc) throw new NotFoundException('Reclamation not found');

    const patch: Record<string, unknown> = {};
    if (dto.priority) patch.priority = dto.priority;
    if (dto.status) patch.status = dto.status;
    if (dto.assigneeId) patch.assigneeId = new Types.ObjectId(dto.assigneeId);
    if (dto.resolutionNote !== undefined) patch.resolutionNote = dto.resolutionNote;
    if (dto.resolution !== undefined) patch.resolution = dto.resolution;
    if (dto.moderationAction !== undefined) {
      patch.moderationAction = dto.moderationAction;
    }

    if (dto.status === ReclamationStatus.RESOLVED) {
      patch.resolvedBy = new Types.ObjectId(adminId);
      patch.resolvedAt = new Date();
    }

    // Re-open when moved back to an open state.
    if (
      dto.status &&
      [ReclamationStatus.OPEN, ReclamationStatus.IN_PROGRESS].includes(
        dto.status as ReclamationStatus,
      )
    ) {
      patch.resolvedAt = null;
    }

    const actionChanged =
      dto.moderationAction !== undefined &&
      dto.moderationAction !== doc.moderationAction;
    if (actionChanged) {
      await this.applyModerationAction(
        dto.moderationAction!,
        doc.targetType,
        doc.targetId,
        dto.resolutionNote,
      );
    }

    await this.reclamations.updateById(id, { $set: patch });
    await this.cache.del('admin:stats');

    return this.adminGet(id);
  }

  private async resolveTargetSnapshot(
    targetType: ReclamationTargetType,
    targetId: string,
  ): Promise<Record<string, unknown> | null> {
    if (targetType === ReclamationTargetType.VEHICLE) {
      const vehicle = await this.vehicles
        .findById(targetId)
        .then(async (v) => {
          if (!v) return null;
          return (await v.populate('brandId modelId sellerId')).toObject();
        });
      if (!vehicle) return { missing: true, id: targetId };
      const o = vehicle as unknown as Record<string, unknown>;
      return {
        id: toId(o._id),
        title: o.title,
        price: o.price,
        year: o.year,
        mileage: o.mileage,
        published: o.published,
        brandName:
          (o.brandId as { name?: string } | null)?.name ?? null,
        modelName:
          (o.modelId as { name?: string } | null)?.name ?? null,
        sellerName: (() => {
          const s = o.sellerId as { firstName?: string; lastName?: string } | null;
          return s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() : null;
        })(),
        images: o.images ?? [],
      };
    }
    if (targetType === ReclamationTargetType.USER) {
      const user = await this.users.findById(targetId);
      if (!user) return { missing: true, id: targetId };
      const o = user.toObject() as unknown as Record<string, unknown>;
      return {
        id: toId(o._id),
        email: o.email,
        firstName: o.firstName,
        lastName: o.lastName,
        role: o.role,
        status: o.status,
        phone: o.phone,
      };
    }
    if (targetType === ReclamationTargetType.DEALER) {
      const dealer = await this.dealers.findById(targetId);
      if (!dealer) return { missing: true, id: targetId };
      const o = dealer.toObject() as unknown as Record<string, unknown>;
      return {
        id: toId(o._id),
        name: o.name,
        city: o.city,
        country: o.country,
        rating: o.rating,
        verified: o.verified,
      };
    }
    return { id: targetId };
  }

  private async applyModerationAction(
    action: ModerationAction,
    targetType: ReclamationTargetType,
    targetId: string,
    note?: string,
  ) {
    if (!action || action === ModerationAction.NONE) return;

    const invalidateVehicle = async (id: string) => {
      await this.es.deleteVehicle(id);
      await this.cache.del('search:*');
      await this.cache.del(`vehicle:${id}`);
      await this.cache.del('stats');
    };

    switch (action) {
      case ModerationAction.UNPUBLISH_VEHICLE:
        if (targetType !== ReclamationTargetType.VEHICLE) {
          throw new BadRequestException(
            'Unpublish action requires a VEHICLE reclamation',
          );
        }
        await this.vehicles.updateById(targetId, {
          $set: { published: false, moderationReason: note },
        });
        await invalidateVehicle(targetId);
        break;

      case ModerationAction.DELETE_VEHICLE:
        if (targetType !== ReclamationTargetType.VEHICLE) {
          throw new BadRequestException(
            'Delete action requires a VEHICLE reclamation',
          );
        }
        await this.vehicles.deleteById(targetId);
        await invalidateVehicle(targetId);
        break;

      case ModerationAction.SUSPEND_USER:
      case ModerationAction.BAN_USER:
        if (targetType !== ReclamationTargetType.USER) {
          throw new BadRequestException(
            'User action requires a USER reclamation',
          );
        }
        await this.users.updateById(targetId, {
          $set: {
            status: action === ModerationAction.BAN_USER ? 'BANNED' : 'SUSPENDED',
            moderationReason: note,
          },
        });
        break;

      case ModerationAction.DELETE_USER:
        if (targetType !== ReclamationTargetType.USER) {
          throw new BadRequestException(
            'User action requires a USER reclamation',
          );
        }
        await this.users.deleteById(targetId);
        break;

      case ModerationAction.DELETE_DEALER:
        if (targetType !== ReclamationTargetType.DEALER) {
          throw new BadRequestException(
            'Dealer action requires a DEALER reclamation',
          );
        }
        await this.dealers.deleteById(targetId);
        break;

      case ModerationAction.WARNING:
        break;

      default:
        break;
    }
  }

  /** Counts broken down by status — used by the admin dashboard. */
  async statusBreakdown() {
    const docs = await this.reclamations.findMany({});
    const counts: Record<string, number> = {
      [ReclamationStatus.OPEN]: 0,
      [ReclamationStatus.IN_PROGRESS]: 0,
      [ReclamationStatus.RESOLVED]: 0,
      [ReclamationStatus.CLOSED]: 0,
      [ReclamationStatus.REJECTED]: 0,
    };
    for (const doc of docs) {
      const status = doc.status as ReclamationStatus;
      if (status in counts) counts[status] += 1;
    }
    return counts;
  }
}
