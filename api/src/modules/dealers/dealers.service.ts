import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DealersRepository } from './dealers.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { serializeEntity, serializeVehicle, toId } from '../../common/mappers/serialize';

@Injectable()
export class DealersService {
  constructor(
    private readonly dealers: DealersRepository,
    private readonly vehicles: VehiclesRepository,
  ) {}

  async findAll() {
    const items = await this.dealers.findMany({}, { sort: { rating: -1 } });
    return Promise.all(
      items.map(async (d) => {
        const count = await this.vehicles.count({ dealerId: d._id, published: true });
        return {
          ...serializeEntity(d.toObject() as unknown as Record<string, unknown>),
          _count: { vehicles: count },
        };
      }),
    );
  }

  async findOne(id: string) {
    const dealer = await this.dealers.findById(id);
    if (!dealer) throw new NotFoundException('Dealer not found');
    const vehicles = await this.vehicles.findMany(
      { dealerId: new Types.ObjectId(id), published: true },
      {
        sort: { createdAt: -1 },
        limit: 50,
        populate: ['brandId', 'modelId'],
      },
    );
    return {
      ...serializeEntity(dealer.toObject() as unknown as Record<string, unknown>),
      vehicles: vehicles.map((v) =>
        serializeVehicle(v.toObject() as unknown as Record<string, unknown>),
      ),
    };
  }
}
