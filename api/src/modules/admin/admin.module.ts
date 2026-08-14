import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersRepository } from '../users/users.repository';
import { DealersRepository } from '../dealers/dealers.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { BrandsRepository } from '../brands/brands.repository';
import { ReclamationsModule } from '../reclamations/reclamations.module';

@Module({
  imports: [DatabaseModule, AuthModule, ReclamationsModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    UsersRepository,
    DealersRepository,
    VehiclesRepository,
    BrandsRepository,
  ],
})
export class AdminModule {}
