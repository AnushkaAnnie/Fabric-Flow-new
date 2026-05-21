import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { YarnLotsService } from './yarn-lots.service';
import type { CreateYarnLotDto, UpdateYarnLotDto } from '@textile-flow/shared';
import { CreateYarnLotSchema, UpdateYarnLotSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('yarn-lots')
export class YarnLotsController {
  constructor(private readonly service: YarnLotsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateYarnLotSchema)) dto: CreateYarnLotDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('hfCode') hfCode?: string,
    @Query('knitterId') knitterId?: string,
  ) {
    const knitterIdNum = knitterId ? parseInt(knitterId, 10) : undefined;
    return this.service.findAll({ hfCode, knitterId: knitterIdNum });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateYarnLotSchema)) dto: UpdateYarnLotDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/issue')
  issue(
    @Param('id', ParseIntPipe) id: number,
    @Body('knitterId', ParseIntPipe) knitterId: number,
    @Body('weight', ParseIntPipe) weight: number,
  ) {
    return this.service.issue(id, knitterId, weight);
  }
}
