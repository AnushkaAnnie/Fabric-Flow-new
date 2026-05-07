import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { CreateColourDto, UpdateColourDto } from '@textile-flow/shared';
import { ColoursService } from './colours.service';

@Controller('colours')
export class ColoursController {
  constructor(private readonly coloursService: ColoursService) {}

  @Get()
  findAll() {
    return this.coloursService.findAll();
  }

  @Post()
  create(@Body() dto: CreateColourDto) {
    return this.coloursService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coloursService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateColourDto) {
    return this.coloursService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coloursService.remove(id);
  }
}
