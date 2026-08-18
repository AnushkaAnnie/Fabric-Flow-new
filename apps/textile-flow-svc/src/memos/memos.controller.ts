import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { MemosService } from './memos.service';
import type { CreateMemoDto } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateMemoSchema } from '@textile-flow/shared';
import {
  type AuthenticatedRequest,
  resolveUser,
} from '../common/types/authenticated-request';

@Controller('memos')
export class MemosController {
  constructor(private readonly service: MemosService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateMemoSchema)) dto: CreateMemoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, resolveUser(req));
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
