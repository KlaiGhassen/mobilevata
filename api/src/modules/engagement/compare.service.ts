import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { ComparisonsRepository } from './engagement.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { serializeVehicle, toId } from '../../common/mappers/serialize';

@Injectable()
export class CompareService {
  constructor(
    private readonly comparisons: ComparisonsRepository,
    private readonly vehicles: VehiclesRepository,
  ) {}

  private async getIds(userId: string): Promise<string[]> {
    const row = await this.comparisons.findOne({
      userId: new Types.ObjectId(userId),
    });
    return (row?.vehicleIds || []).map((id) => toId(id));
  }

  async list(userId: string) {
    const ids = await this.getIds(userId);
    if (!ids.length) return [];
    const vehicles = await this.vehicles.findMany(
      { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } },
      { populate: ['brandId', 'modelId'] },
    );
    return ids
      .map((id) => vehicles.find((v) => toId(v._id) === id))
      .filter(Boolean)
      .map((v) => serializeVehicle(v!.toObject() as unknown as Record<string, unknown>));
  }

  async add(userId: string, vehicleId: string) {
    const ids = await this.getIds(userId);
    if (ids.includes(vehicleId)) return this.list(userId);
    if (ids.length >= 3) {
      throw new BadRequestException('Maximum 3 vehicles to compare');
    }
    const next = [...ids, vehicleId].map((id) => new Types.ObjectId(id));
    await this.comparisons.upsert(
      { userId: new Types.ObjectId(userId) },
      {
        userId: new Types.ObjectId(userId),
        vehicleIds: next,
      },
    );
    return this.list(userId);
  }

  async remove(userId: string, vehicleId: string) {
    const ids = (await this.getIds(userId))
      .filter((id) => id !== vehicleId)
      .map((id) => new Types.ObjectId(id));
    await this.comparisons.upsert(
      { userId: new Types.ObjectId(userId) },
      { userId: new Types.ObjectId(userId), vehicleIds: ids },
    );
    return this.list(userId);
  }

  async set(userId: string, vehicleIds: string[]) {
    const unique = [...new Set(vehicleIds)].slice(0, 3).map((id) => new Types.ObjectId(id));
    await this.comparisons.upsert(
      { userId: new Types.ObjectId(userId) },
      { userId: new Types.ObjectId(userId), vehicleIds: unique },
    );
    return this.list(userId);
  }
}
