import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  ProductionPlanStatus,
} from '@textile-flow/shared';

import { PrismaService }
  from '../prisma/prisma.service';

import { LotTrackerService }
  from '../lot-tracker/lot-tracker.service';

import { CreateProductionPlanDto }
  from './dto/create-production-plan.dto';

import { CreateJobCardDto }
  from './dto/create-job-card.dto';

import { UpdateProductionPlanDto }
  from './dto/update-production-plan.dto';

@Injectable()
export class ProductionPlanningService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly lotTrackerService:
      LotTrackerService,
  ) {}

  async generatePlanNo() {
    const count =
      await this.prisma.productionPlan.count();

    return `PLAN-${new Date().getFullYear()}-${String(
      count + 1,
    ).padStart(4, '0')}`;
  }

  async generateJobCardNo() {
    const count =
      await this.prisma.jobCard.count();

    return `JOB-${new Date().getFullYear()}-${String(
      count + 1,
    ).padStart(4, '0')}`;
  }

  async createPlan(
    dto: CreateProductionPlanDto,
  ) {
    const existingLot =
      await this.prisma.knittingLot.findFirst({
        where: {
          lotNo: dto.lotNo,
        },
      });

    if (!existingLot) {
      throw new BadRequestException(
        'Invalid lot number',
      );
    }

    const delayed =
      new Date(dto.plannedDate)
        .getTime() <
      Date.now();

    return this.prisma.productionPlan.create({
      data: {
        planNo:
          await this.generatePlanNo(),

        lotNo: dto.lotNo,

        stage: dto.stage,

        plannedWeight:
          dto.plannedWeight,

        plannedDate:
          new Date(dto.plannedDate),

        priority:
          dto.priority,

        remarks:
          dto.remarks,

        delayed,

        status:
          ProductionPlanStatus.PENDING,
      },
    });
  }

  async updatePlan(
    id: number,
    dto: UpdateProductionPlanDto,
  ) {
    const existing =
      await this.prisma.productionPlan.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new BadRequestException(
        'Production plan not found',
      );
    }

    const updated =
      await this.prisma.productionPlan.update({
        where: { id },

        data: {
          status:
            dto.status,

          completedWeight:
            dto.completedWeight,

          remarks:
            dto.remarks,

          actualStartDate:
            dto.status ===
            ProductionPlanStatus.IN_PROGRESS
              ? new Date()
              : existing.actualStartDate,

          actualEndDate:
            dto.status ===
            ProductionPlanStatus.COMPLETED
              ? new Date()
              : existing.actualEndDate,
        },
      });

    await this.lotTrackerService
      .evaluateLot(
        updated.lotNo,
      )
      .catch(() => {});

    return updated;
  }

  async createJobCard(
    dto: CreateJobCardDto,
  ) {
    const plan =
      await this.prisma.productionPlan.findUnique({
        where: {
          id:
            dto.productionPlanId,
        },
      });

    if (!plan) {
      throw new BadRequestException(
        'Production plan not found',
      );
    }

    return this.prisma.jobCard.create({
      data: {
        jobCardNo:
          await this.generateJobCardNo(),

        productionPlanId:
          dto.productionPlanId,

        machineNo:
          dto.machineNo,

        operatorName:
          dto.operatorName,

        shift:
          dto.shift,

        targetWeight:
          dto.targetWeight,

        remarks:
          dto.remarks,

        issuedAt:
          new Date(),

        status:
          ProductionPlanStatus.ISSUED,
      },
    });
  }

  async startJobCard(
    id: number,
  ) {
    return this.prisma.jobCard.update({
      where: { id },

      data: {
        status:
          ProductionPlanStatus.IN_PROGRESS,

        startedAt:
          new Date(),
      },
    });
  }

  async completeJobCard(
    id: number,
    completedWeight: number,
  ) {
    const job =
      await this.prisma.jobCard.findUnique({
        where: { id },

        include: {
          productionPlan: true,
        },
      });

    if (!job) {
      throw new BadRequestException(
        'Job card not found',
      );
    }

    await this.prisma.jobCard.update({
      where: { id },

      data: {
        completedWeight,

        completedAt:
          new Date(),

        status:
          ProductionPlanStatus.COMPLETED,
      },
    });

    const totalCompleted =
      await this.prisma.jobCard.aggregate({
        where: {
          productionPlanId:
            job.productionPlanId,
        },

        _sum: {
          completedWeight: true,
        },
      });

    const completed =
      Number(
        totalCompleted._sum
          .completedWeight ?? 0,
      );

    const status =
      completed >=
      job.productionPlan
        .plannedWeight
        ? ProductionPlanStatus.COMPLETED
        : ProductionPlanStatus.IN_PROGRESS;

    await this.prisma.productionPlan.update({
      where: {
        id:
          job.productionPlanId,
      },

      data: {
        completedWeight:
          completed,

        status,
      },
    });

    await this.lotTrackerService
      .evaluateLot(
        job.productionPlan.lotNo,
      )
      .catch(() => {});

    return {
      success: true,
    };
  }

  async getTodayPlans() {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    const tomorrow =
      new Date(today);

    tomorrow.setDate(
      tomorrow.getDate() + 1,
    );

    return this.prisma.productionPlan.findMany({
      where: {
        plannedDate: {
          gte: today,

          lt: tomorrow,
        },
      },

      orderBy: {
        priority: 'desc',
      },
    });
  }

  async getDelayedPlans() {
    return this.prisma.productionPlan.findMany({
      where: {
        delayed: true,

        status: {
          not:
            ProductionPlanStatus.COMPLETED,
        },
      },

      orderBy: {
        plannedDate: 'asc',
      },
    });
  }

  async getSummary() {
    const [
      totalPlans,

      completedPlans,

      pendingPlans,

      inProgressPlans,
    ] = await Promise.all([
      this.prisma.productionPlan.count(),

      this.prisma.productionPlan.count({
        where: {
          status:
            ProductionPlanStatus.COMPLETED,
        },
      }),

      this.prisma.productionPlan.count({
        where: {
          status:
            ProductionPlanStatus.PENDING,
        },
      }),

      this.prisma.productionPlan.count({
        where: {
          status:
            ProductionPlanStatus.IN_PROGRESS,
        },
      }),
    ]);

    return {
      totalPlans,

      completedPlans,

      pendingPlans,

      inProgressPlans,
    };
  }
}
