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
import { YarnQualitiesService } from './yarn-qualities.service';

@Controller('yarn-qualities')
export class YarnQualitiesController {
  constructor(private readonly yarnQualitiesService: YarnQualitiesService) {}

  @Get()
  findAll() {
    return this.yarnQualitiesService.findAll();
  }

  @Post()
  create(@Body() dto: Shared.CreateYarnQualityDto) {
    return this.yarnQualitiesService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.yarnQualitiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Shared.UpdateYarnQualityDto,
  ) {
    return this.yarnQualitiesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.yarnQualitiesService.remove(id);
  }
}
