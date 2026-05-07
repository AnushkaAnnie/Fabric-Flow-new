import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type {
  CreateCompacterDto,
  UpdateCompacterDto,
} from '@textile-flow/shared';
import { CompactersService } from './compacters.service';

@Controller('compacters')
export class CompactersController {
  constructor(private readonly compactersService: CompactersService) {}

  @Get()
  findAll() {
    return this.compactersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCompacterDto) {
    return this.compactersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.compactersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCompacterDto) {
    return this.compactersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.compactersService.remove(id);
  }
}
