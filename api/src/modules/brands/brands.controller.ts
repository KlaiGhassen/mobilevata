import { Controller, Get, Param, Query } from '@nestjs/common';
import { BrandsService } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  findAll(@Query('popular') popular?: string) {
    return this.brands.findAll(popular === 'true');
  }

  @Get('by-name/:name/models')
  modelsByName(@Param('name') name: string) {
    return this.brands.getModelsByBrandName(name);
  }

  @Get(':id/models')
  models(@Param('id') id: string) {
    return this.brands.getModels(id);
  }
}
