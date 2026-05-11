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
import { CompactersService } from './compacters.service';

@Controller('compacters')
export class CompactersController {
  constructor(private readonly compactersService: CompactersService) {}

  @Get()
  findAll() {
    return this.compactersService.findAll();
  }

  @Post()
  create(@Body() dto: Shared.CreateCompacterDto) {
    return this.compactersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.compactersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Shared.UpdateCompacterDto) {
    return this.compactersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.compactersService.remove(id);
  }
}
