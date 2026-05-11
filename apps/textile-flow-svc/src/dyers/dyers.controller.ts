import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
} from '@nestjs/common';
import * as Shared from '@textile-flow/shared';
import { DyersService } from './dyers.service';

@Controller('dyers')
export class DyersController {
  constructor(private readonly dyersService: DyersService) {}

  @Get()
  findAll() {
    return this.dyersService.findAll();
  }

  @Post()
  create(@Body() dto: Shared.CreateDyerDto) {
    return this.dyersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dyersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Shared.UpdateDyerDto) {
    return this.dyersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dyersService.remove(id);
  }
}
