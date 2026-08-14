import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsRepository, ModelsRepository } from './brands.repository';
import { BRANDS_SERVICE } from '../../common/interfaces/tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [BrandsController],
  providers: [
    BrandsService,
    BrandsRepository,
    ModelsRepository,
    { provide: BRANDS_SERVICE, useExisting: BrandsService },
  ],
  exports: [BrandsService, BrandsRepository, ModelsRepository],
})
export class BrandsModule {}
