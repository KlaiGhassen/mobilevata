import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ReclamationsController } from './reclamations.controller';
import { ReclamationsService } from './reclamations.service';
import { ReclamationsRepository } from './reclamations.repository';
import { UsersRepository } from '../users/users.repository';
import { DealersRepository } from '../dealers/dealers.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ReclamationsController],
  providers: [
    ReclamationsService,
    ReclamationsRepository,
    UsersRepository,
    DealersRepository,
    VehiclesRepository,
  ],
  exports: [ReclamationsService, ReclamationsRepository],
})
export class ReclamationsModule {}
