import { Controller, Get, Post, Body } from '@nestjs/common';
import { CompactingsService } from './compactings.service';
import type { CreateCompactingDto } from '@textile-flow/shared';
import { CreateCompactingSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('compactings')
export class CompactingsController {
  constructor(private readonly service: CompactingsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateCompactingSchema))
    dto: CreateCompactingDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
