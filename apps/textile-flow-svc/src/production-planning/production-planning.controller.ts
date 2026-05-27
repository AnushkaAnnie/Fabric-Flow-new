import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ProductionPlanningService }
  from './production-planning.service';

import { CreateProductionPlanDto }
  from './dto/create-production-plan.dto';

import { UpdateProductionPlanDto }
  from './dto/update-production-plan.dto';

import { CreateJobCardDto }
  from './dto/create-job-card.dto';

@Controller('production-planning')
export class ProductionPlanningController {
  constructor(
    private readonly productionPlanningService:
      ProductionPlanningService,
  ) {}

  @Post()
  async createPlan(
    @Body()
    dto: CreateProductionPlanDto,
  ) {
    return this.productionPlanningService
      .createPlan(dto);
  }

  @Patch(':id')
  async updatePlan(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProductionPlanDto,
  ) {
    return this.productionPlanningService
      .updatePlan(
        Number(id),
        dto,
      );
  }

  @Post('job-card')
  async createJobCard(
    @Body()
    dto: CreateJobCardDto,
  ) {
    return this.productionPlanningService
      .createJobCard(dto);
  }

  @Patch('job-card/:id/start')
  async startJobCard(
    @Param('id')
    id: string,
  ) {
    return this.productionPlanningService
      .startJobCard(
        Number(id),
      );
  }

  @Patch('job-card/:id/complete')
  async completeJobCard(
    @Param('id')
    id: string,

    @Body('completedWeight')
    completedWeight: number,
  ) {
    return this.productionPlanningService
      .completeJobCard(
        Number(id),
        completedWeight,
      );
  }

  @Get('today')
  async todayPlans() {
    return this.productionPlanningService
      .getTodayPlans();
  }

  @Get('delayed')
  async delayedPlans() {
    return this.productionPlanningService
      .getDelayedPlans();
  }

  @Get('summary')
  async summary() {
    return this.productionPlanningService
      .getSummary();
  }
}
