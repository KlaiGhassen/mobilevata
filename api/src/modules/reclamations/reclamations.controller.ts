import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ReclamationsService } from './reclamations.service';
import { CreateReclamationDto } from './dto/reclamation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('reclamations')
@UseGuards(JwtAuthGuard)
export class ReclamationsController {
  constructor(private readonly reclamations: ReclamationsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReclamationDto) {
    return this.reclamations.create(user.userId, dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.reclamations.listMine(user.userId);
  }
}
