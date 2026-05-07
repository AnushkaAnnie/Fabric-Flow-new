import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { CreateDyerDto, UpdateDyerDto } from '@textile-flow/shared';
import { DyersService } from './dyers.service';

@Controller('dyers')
export class DyersController {
  constructor(private readonly dyersService: DyersService) {}

  @Get()
  findAll() {
    return this.dyersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateDyerDto) {
    return this.dyersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dyersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDyerDto) {
    return this.dyersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dyersService.remove(id);
  }
}
