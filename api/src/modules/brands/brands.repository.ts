import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository';
import {
  Brand,
  BrandDocument,
  VehicleModel,
  ModelDocument,
} from '../../database/schemas/brand.schema';

@Injectable()
export class BrandsRepository extends BaseRepository<BrandDocument> {
  constructor(@InjectModel(Brand.name) model: Model<BrandDocument>) {
    super(model);
  }
}

@Injectable()
export class ModelsRepository extends BaseRepository<ModelDocument> {
  constructor(@InjectModel(VehicleModel.name) model: Model<ModelDocument>) {
    super(model);
  }

  findByBrand(brandId: string) {
    return this.findMany({ brandId }, { sort: { name: 1 } });
  }
}
