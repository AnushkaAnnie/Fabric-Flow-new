import { Controller, Get, Param } from '@nestjs/common';
import { KnitterStockService } from './knitter-stock.service';

@Controller('knitter-stocks')
export class KnitterStockController {
  constructor(private readonly knitterStockService: KnitterStockService) {}

  @Get(':knitterId')
  findByKnitter(@Param('knitterId') knitterId: string) {
    return this.knitterStockService.findByKnitter(knitterId);
  }
}
