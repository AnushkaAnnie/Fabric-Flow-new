import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { YarnInwardService } from './yarn-inward.service';
import type { CreateYarnInwardDto, UpdateYarnInwardDto } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateYarnInwardSchema, UpdateYarnInwardSchema } from '@textile-flow/shared';

@Controller('yarn-inward')
export class YarnInwardController {
  constructor(private readonly service: YarnInwardService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateYarnInwardSchema))
    dto: CreateYarnInwardDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateYarnInwardSchema)) dto: UpdateYarnInwardDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

