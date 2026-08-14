import { Controller, Get, Param } from '@nestjs/common';
import { DealersService } from './dealers.service';

@Controller('dealers')
export class DealersController {
  constructor(private readonly dealers: DealersService) {}

  @Get()
  findAll() {
    return this.dealers.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dealers.findOne(id);
  }
}
