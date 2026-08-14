import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import {
  CreateAdminUserDto,
  CreateBrandDto,
  ListAdminVehiclesDto,
  ListBrandsDto,
  ListDealersDto,
  ListUsersDto,
  UpdateAdminUserDto,
  UpdateAdminVehicleDto,
  UpdateBrandDto,
  UpdateDealerDto,
} from './dto/admin.dto';
import {
  ListReclamationsDto,
  UpdateReclamationDto,
} from '../reclamations/dto/reclamation.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.getStats();
  }

  // ─── Users ───────────────────────────────────────────────────────────────

  @Get('users')
  users(@Query() query: ListUsersDto) {
    return this.admin.listUsers(query);
  }

  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Post('users')
  @Roles('SUPER_ADMIN')
  createAdmin(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAdminUserDto,
  ) {
    return this.admin.createAdminUser(user.userId, dto);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.admin.updateUser(user.userId, id, dto);
  }

  // ─── Vehicles ────────────────────────────────────────────────────────────

  @Get('vehicles')
  vehicles(@Query() query: ListAdminVehiclesDto) {
    return this.admin.listVehicles(query);
  }

  @Get('vehicles/:id')
  vehicle(@Param('id') id: string) {
    return this.admin.getVehicle(id);
  }

  @Patch('vehicles/:id')
  updateVehicle(@Param('id') id: string, @Body() dto: UpdateAdminVehicleDto) {
    return this.admin.updateVehicle(id, dto);
  }

  @Delete('vehicles/:id')
  deleteVehicle(@Param('id') id: string) {
    return this.admin.deleteVehicle(id);
  }

  // ─── Dealers ─────────────────────────────────────────────────────────────

  @Get('dealers')
  dealers(@Query() query: ListDealersDto) {
    return this.admin.listDealers(query);
  }

  @Patch('dealers/:id')
  updateDealer(@Param('id') id: string, @Body() dto: UpdateDealerDto) {
    return this.admin.updateDealer(id, dto);
  }

  @Delete('dealers/:id')
  deleteDealer(@Param('id') id: string) {
    return this.admin.deleteDealer(id);
  }

  // ─── Brands ──────────────────────────────────────────────────────────────

  @Get('brands')
  brands(@Query() query: ListBrandsDto) {
    return this.admin.listBrands(query);
  }

  @Post('brands')
  createBrand(@Body() dto: CreateBrandDto) {
    return this.admin.createBrand(dto);
  }

  @Patch('brands/:id')
  updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.admin.updateBrand(id, dto);
  }

  @Delete('brands/:id')
  deleteBrand(@Param('id') id: string) {
    return this.admin.deleteBrand(id);
  }

  // ─── Reclamations ────────────────────────────────────────────────────────

  @Get('reclamations')
  reclamations(@Query() query: ListReclamationsDto) {
    return this.admin.listReclamations(query);
  }

  @Get('reclamations/:id')
  reclamation(@Param('id') id: string) {
    return this.admin.getReclamation(id);
  }

  @Patch('reclamations/:id')
  updateReclamation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateReclamationDto,
  ) {
    return this.admin.updateReclamation(id, dto, user.userId);
  }
}
