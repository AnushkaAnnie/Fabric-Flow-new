import { Controller, Get } from '@nestjs/common';
import { YarnLotsService } from './yarn-lots.service';

@Controller('yarn-lots')
export class YarnLotsController {
  constructor(private readonly yarnLotsService: YarnLotsService) {}

  @Get()
  findAll() {
    return this.yarnLotsService.findAll();
  }
}
