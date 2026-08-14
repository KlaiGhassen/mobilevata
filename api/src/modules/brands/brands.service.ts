import { Injectable, NotFoundException } from '@nestjs/common';
import { BrandsRepository, ModelsRepository } from './brands.repository';
import { serializeEntity, toId } from '../../common/mappers/serialize';

@Injectable()
export class BrandsService {
  constructor(
    private readonly brands: BrandsRepository,
    private readonly models: ModelsRepository,
  ) {}

  async findAll(popularOnly = false) {
    const items = await this.brands.findMany(
      popularOnly ? { popular: true } : {},
      { sort: { name: 1 } },
    );
    return items.map((b) =>
      serializeEntity(b.toObject() as unknown as Record<string, unknown>),
    );
  }

  async getModels(brandId: string) {
    const items = await this.models.findByBrand(brandId);
    return items.map((m) => ({
      id: toId(m._id),
      name: m.name,
      brandId: toId(m.brandId),
    }));
  }

  async getModelsByBrandName(name: string) {
    const brand = await this.brands.findOne({ name });
    if (!brand) throw new NotFoundException('Brand not found');
    return this.getModels(toId(brand._id));
  }
}
