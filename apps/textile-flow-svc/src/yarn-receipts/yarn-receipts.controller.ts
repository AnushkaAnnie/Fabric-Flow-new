import { Controller, Get, Post, Body } from '@nestjs/common';
import { YarnReceiptsService } from './yarn-receipts.service';
import type { CreateYarnReceiptDto } from '@textile-flow/shared';
import { CreateYarnReceiptSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('yarn-receipts')
export class YarnReceiptsController {
  constructor(private readonly service: YarnReceiptsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateYarnReceiptSchema)) dto: CreateYarnReceiptDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
