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
  CreateWashTypeDto,
  UpdateWashTypeDto,
} from '@textile-flow/shared';
import { WashTypesService } from './wash-types.service';

@Controller('wash-types')
export class WashTypesController {
  constructor(private readonly washTypesService: WashTypesService) {}

  @Get()
  findAll() {
    return this.washTypesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateWashTypeDto) {
    return this.washTypesService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.washTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWashTypeDto) {
    return this.washTypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.washTypesService.remove(id);
  }
}
