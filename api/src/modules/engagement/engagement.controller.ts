import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { FavoritesService } from './favorites.service';
import { CompareService } from './compare.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

class SetCompareDto {
  @IsArray()
  @IsString({ each: true })
  vehicleIds: string[];
}

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user.userId);
  }

  @Post(':vehicleId')
  add(@CurrentUser() user: AuthUser, @Param('vehicleId') vehicleId: string) {
    return this.favorites.add(user.userId, vehicleId);
  }

  @Delete(':vehicleId')
  remove(@CurrentUser() user: AuthUser, @Param('vehicleId') vehicleId: string) {
    return this.favorites.remove(user.userId, vehicleId);
  }
}

@Controller('compare')
@UseGuards(JwtAuthGuard)
export class CompareController {
  constructor(private readonly compare: CompareService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.compare.list(user.userId);
  }

  @Post(':vehicleId')
  add(@CurrentUser() user: AuthUser, @Param('vehicleId') vehicleId: string) {
    return this.compare.add(user.userId, vehicleId);
  }

  @Delete(':vehicleId')
  remove(@CurrentUser() user: AuthUser, @Param('vehicleId') vehicleId: string) {
    return this.compare.remove(user.userId, vehicleId);
  }

  @Post()
  set(@CurrentUser() user: AuthUser, @Body() body: SetCompareDto) {
    if (!Array.isArray(body.vehicleIds)) {
      throw new BadRequestException('vehicleIds required');
    }
    return this.compare.set(user.userId, body.vehicleIds);
  }
}
