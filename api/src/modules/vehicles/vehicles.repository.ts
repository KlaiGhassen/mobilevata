import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Vehicle, VehicleDocument } from '../../database/schemas/vehicle.schema';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';
import { escapeRegExp } from '../../common/security/escape';

@Injectable()
export class VehiclesRepository extends BaseRepository<VehicleDocument> {
  constructor(@InjectModel(Vehicle.name) model: Model<VehicleDocument>) {
    super(model);
  }

  buildSearchFilter(query: SearchVehiclesDto): Record<string, unknown> {
    const filter: Record<string, unknown> = { published: true };

    if (query.brandId) filter.brandId = new Types.ObjectId(query.brandId);
    if (query.modelId) filter.modelId = new Types.ObjectId(query.modelId);
    if (query.priceMin != null || query.priceMax != null) {
      const price: Record<string, number> = {};
      if (query.priceMin != null) price.$gte = query.priceMin;
      if (query.priceMax != null) price.$lte = query.priceMax;
      filter.price = price;
    }
    if (query.yearMin != null || query.yearMax != null) {
      const year: Record<string, number> = {};
      if (query.yearMin != null) year.$gte = query.yearMin;
      if (query.yearMax != null) year.$lte = query.yearMax;
      filter.year = year;
    }
    if (query.mileageMax != null) filter.mileage = { $lte: query.mileageMax };
    if (query.transmission) filter.transmission = query.transmission;
    if (query.fuelType) filter.fuelType = query.fuelType;
    if (query.bodyType) filter.bodyType = query.bodyType;
    if (query.country) filter.country = query.country;
    if (query.condition) filter.condition = query.condition;
    if (query.color) filter.color = new RegExp(escapeRegExp(query.color), 'i');
    if (query.sellersType) filter.sellersType = query.sellersType;
    if (query.category) filter.categoryTags = query.category;
    if (query.q) filter.$text = { $search: query.q };

    return filter;
  }

  resolveSort(sort?: string): Record<string, 1 | -1> {
    switch (sort) {
      case 'price_asc':
        return { price: 1 };
      case 'price_desc':
        return { price: -1 };
      case 'year_desc':
        return { year: -1 };
      case 'mileage_asc':
        return { mileage: 1 };
      default:
        return { createdAt: -1 };
    }
  }

  async search(query: SearchVehiclesDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const filter = this.buildSearchFilter(query);
    const sort = this.resolveSort(query.sort);

    const [total, items] = await Promise.all([
      this.count(filter),
      this.model
        .find(filter)
        .populate('brandId')
        .populate('modelId')
        .populate('dealerId', 'name city rating')
        .populate('sellerId', 'firstName lastName role')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
    ]);

    return { total, page, limit, items };
  }

  findPublishedById(id: string) {
    return this.model
      .findOne({ _id: id, published: true })
      .populate('brandId')
      .populate('modelId')
      .populate('dealerId')
      .populate('sellerId', 'firstName lastName role')
      .exec();
  }

  async incrementViews(id: string) {
    await this.model.updateOne({ _id: id }, { $inc: { views: 1 } }).exec();
  }

  async aggregateStats() {
    const [total, byBodyType, byFuel] = await Promise.all([
      this.count({ published: true }),
      this.model.aggregate([
        { $match: { published: true } },
        { $group: { _id: '$bodyType', count: { $sum: 1 } } },
        { $project: { type: '$_id', count: 1, _id: 0 } },
      ]),
      this.model.aggregate([
        { $match: { published: true } },
        { $group: { _id: '$fuelType', count: { $sum: 1 } } },
        { $project: { type: '$_id', count: 1, _id: 0 } },
      ]),
    ]);
    return { total, byBodyType, byFuel };
  }
}
