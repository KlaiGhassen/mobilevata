import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import {
  FavoritesController,
  CompareController,
} from './engagement.controller';
import { FavoritesService } from './favorites.service';
import { CompareService } from './compare.service';
import {
  FavoritesRepository,
  ComparisonsRepository,
} from './engagement.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import {
  FAVORITES_SERVICE,
  COMPARE_SERVICE,
} from '../../common/interfaces/tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [FavoritesController, CompareController],
  providers: [
    FavoritesService,
    CompareService,
    FavoritesRepository,
    ComparisonsRepository,
    VehiclesRepository,
    { provide: FAVORITES_SERVICE, useExisting: FavoritesService },
    { provide: COMPARE_SERVICE, useExisting: CompareService },
  ],
})
export class EngagementModule {}
