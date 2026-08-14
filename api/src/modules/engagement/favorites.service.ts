import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FavoritesRepository } from '../engagement/engagement.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { serializeVehicle, toId } from '../../common/mappers/serialize';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly favorites: FavoritesRepository,
    private readonly vehicles: VehiclesRepository,
  ) {}

  async list(userId: string) {
    const items = await this.favorites.findMany(
      { userId: new Types.ObjectId(userId) },
      { sort: { createdAt: -1 }, populate: 'vehicleId' },
    );

    const result = [];
    for (const fav of items) {
      const vehicleDoc = fav.vehicleId as unknown as { toObject?: () => Record<string, unknown>; _id?: unknown };
      // if populate failed or is ObjectId only, fetch
      let vehicle;
      if (vehicleDoc && typeof vehicleDoc.toObject === 'function') {
        // Need brand/model - refetch fully
        vehicle = await this.vehicles.findPublishedById(toId(vehicleDoc._id));
      } else {
        vehicle = await this.vehicles.findPublishedById(toId(fav.vehicleId));
      }
      if (!vehicle) continue;
      result.push({
        id: toId(fav._id),
        vehicle: serializeVehicle(vehicle.toObject() as unknown as Record<string, unknown>),
      });
    }
    return result;
  }

  async add(userId: string, vehicleId: string) {
    const vehicle = await this.vehicles.findById(vehicleId);
    if (!vehicle) throw new NotFoundException();
    return this.favorites.upsert(
      {
        userId: new Types.ObjectId(userId),
        vehicleId: new Types.ObjectId(vehicleId),
      },
      {
        userId: new Types.ObjectId(userId),
        vehicleId: new Types.ObjectId(vehicleId),
      },
    );
  }

  async remove(userId: string, vehicleId: string) {
    await this.favorites.deleteMany({
      userId: new Types.ObjectId(userId),
      vehicleId: new Types.ObjectId(vehicleId),
    });
    return { ok: true };
  }
}
