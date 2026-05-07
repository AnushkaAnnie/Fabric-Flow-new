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
  CreateYarnQualityDto,
  UpdateYarnQualityDto,
} from '@textile-flow/shared';
import { YarnQualitiesService } from './yarn-qualities.service';

@Controller('yarn-qualities')
export class YarnQualitiesController {
  constructor(private readonly yarnQualitiesService: YarnQualitiesService) {}

  @Get()
  findAll() {
    return this.yarnQualitiesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateYarnQualityDto) {
    return this.yarnQualitiesService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.yarnQualitiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateYarnQualityDto) {
    return this.yarnQualitiesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.yarnQualitiesService.remove(id);
  }
}
