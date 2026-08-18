import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { CompactingsService } from './compactings.service';
import type { CreateCompactingDto } from '@textile-flow/shared';
import { CreateCompactingSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateCompactingDto } from './dto/update-compacting.dto';
import {
  type AuthenticatedRequest,
  resolveUser,
} from '../common/types/authenticated-request';

@Controller('compactings')
export class CompactingsController {
  constructor(private readonly service: CompactingsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateCompactingSchema))
    dto: CreateCompactingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, resolveUser(req));
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompactingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.update(+id, dto, resolveUser(req));
  }
}
