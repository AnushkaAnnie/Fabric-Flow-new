import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { KnitterProgramsService } from './knitter-programs.service';
import type { CreateKnitterProgramDto } from '@textile-flow/shared';
import { CreateKnitterProgramSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('knitter-programs')
export class KnitterProgramsController {
  constructor(private readonly service: KnitterProgramsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateKnitterProgramSchema)) dto: CreateKnitterProgramDto,
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
}
