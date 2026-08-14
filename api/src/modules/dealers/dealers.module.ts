import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DealersController } from './dealers.controller';
import { DealersService } from './dealers.service';
import { DealersRepository } from './dealers.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { DEALERS_SERVICE } from '../../common/interfaces/tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [DealersController],
  providers: [
    DealersService,
    DealersRepository,
    VehiclesRepository,
    { provide: DEALERS_SERVICE, useExisting: DealersService },
  ],
  exports: [DealersService, DealersRepository],
})
export class DealersModule {}
