import { Controller, Get, Param, Post } from '@nestjs/common';
import { LotTrackerService } from './lot-tracker.service';

@Controller('lot-tracker')
export class LotTrackerController {
  constructor(private readonly lotTrackerService: LotTrackerService) {}

  @Get()
  findAll() {
    return this.lotTrackerService.findAll();
  }

  @Get('delayed')
  findDelayed() {
    return this.lotTrackerService.findDelayed();
  }

  @Get('stage/:stage')
  findByStage(@Param('stage') stage: string) {
    return this.lotTrackerService.findByStage(stage);
  }

  @Get(':lotNo')
  findOne(@Param('lotNo') lotNo: string) {
    return this.lotTrackerService.findByLotNo(lotNo);
  }

  @Post('evaluate/:lotNo')
  evaluate(@Param('lotNo') lotNo: string) {
    return this.lotTrackerService.evaluateLot(lotNo);
  }
}
