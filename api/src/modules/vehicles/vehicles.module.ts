import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './vehicles.repository';
import { UsersRepository } from '../users/users.repository';
import { DealersRepository } from '../dealers/dealers.repository';
import { VEHICLES_SERVICE } from '../../common/interfaces/tokens';
import { ReindexGuard } from '../../common/guards/reindex.guard';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    VehiclesRepository,
    UsersRepository,
    DealersRepository,
    ReindexGuard,
    { provide: VEHICLES_SERVICE, useExisting: VehiclesService },
  ],
  exports: [VehiclesService, VehiclesRepository, VEHICLES_SERVICE],
})
export class VehiclesModule {}
