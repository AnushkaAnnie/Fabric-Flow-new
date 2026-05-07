import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { CreateKnitterDto, UpdateKnitterDto } from '@textile-flow/shared';
import { KnittersService } from './knitters.service';

@Controller('knitters')
export class KnittersController {
  constructor(private readonly knittersService: KnittersService) {}

  @Get()
  findAll() {
    return this.knittersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateKnitterDto) {
    return this.knittersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.knittersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateKnitterDto) {
    return this.knittersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.knittersService.remove(id);
  }
}
