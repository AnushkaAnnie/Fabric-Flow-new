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
import { WashTypesService } from './wash-types.service';

@Controller('wash-types')
export class WashTypesController {
  constructor(private readonly washTypesService: WashTypesService) {}

  @Get()
  findAll() {
    return this.washTypesService.findAll();
  }

  @Post()
  create(@Body() dto: Shared.CreateWashTypeDto) {
    return this.washTypesService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.washTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Shared.UpdateWashTypeDto,
  ) {
    return this.washTypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.washTypesService.remove(id);
  }
}
