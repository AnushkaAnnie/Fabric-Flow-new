import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  ProductionPlanStatus,
  JobCardStatus,
  ProductionPriority,
} from '@prisma/client';

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

    const created =
      await this.prisma.productionPlan.create({
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
            dto.priority as ProductionPriority,

          remarks:
            dto.remarks,

          delayed,

          status:
            ProductionPlanStatus.PENDING,
        },
      });

    await this.reserveProductionInventory({
      lotNo:
        dto.lotNo,

      weight:
        dto.plannedWeight,
    });

    await this.logEvent({
      productionPlanId:
        created.id,

      eventType:
        'PLAN_CREATED',

      message:
        `Production plan ${created.planNo} created`,
    });

    return created;
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
            dto.status as ProductionPlanStatus,

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

  async validateMachineCapacity({
    machineNo,
    plannedDate,
  }: {
    machineNo: string;
    plannedDate: Date;
  }) {
    const start =
      new Date(plannedDate);

    start.setHours(
      0,
      0,
      0,
      0,
    );

    const end =
      new Date(plannedDate);

    end.setHours(
      23,
      59,
      59,
      999,
    );

    const existing =
      await this.prisma.jobCard.count({
        where: {
          machineNo,

          createdAt: {
            gte: start,

            lte: end,
          },

          status: {
            not:
              JobCardStatus.COMPLETED,
          },
        },
      });

    if (existing >= 5) {
      throw new BadRequestException(
        'Machine capacity exceeded',
      );
    }
  }

  async validateShiftCollision({
    machineNo,
    shift,
    plannedDate,
  }: {
    machineNo: string;
    shift: string;
    plannedDate: Date;
  }) {
    const start =
      new Date(plannedDate);

    start.setHours(
      0,
      0,
      0,
      0,
    );

    const end =
      new Date(plannedDate);

    end.setHours(
      23,
      59,
      59,
      999,
    );

    const existing =
      await this.prisma.jobCard.findFirst({
        where: {
          machineNo,

          shift,

          createdAt: {
            gte: start,

            lte: end,
          },

          status: {
            in: [
              JobCardStatus.ISSUED,
              JobCardStatus.IN_PROGRESS,
            ],
          },
        },
      });

    if (existing) {
      throw new BadRequestException(
        `Machine ${machineNo} already allocated for shift ${shift}`,
      );
    }
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

    if (
      plan.status ===
      ProductionPlanStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot create job card for cancelled plan',
      );
    }

    if (
      dto.machineNo
    ) {
      await this.validateMachineCapacity({
        machineNo:
          dto.machineNo,

        plannedDate:
          plan.plannedDate,
      });
    }

    if (
      dto.machineNo &&
      dto.shift
    ) {
      await this.validateShiftCollision({
        machineNo:
          dto.machineNo,

        shift:
          dto.shift,

        plannedDate:
          plan.plannedDate,
      });
    }

    const created =
      await this.prisma.jobCard.create({
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
            JobCardStatus.ISSUED,
        },
      });

    await this.logEvent({
      productionPlanId:
        created.productionPlanId,

      jobCardId:
        created.id,

      eventType:
        'JOB_CARD_CREATED',

      message:
        `Job card ${created.jobCardNo} created`,
    });

    return created;
  }

  async startJobCard(
    id: number,
  ) {
    const existing =
      await this.prisma.jobCard.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new BadRequestException(
        'Job card not found',
      );
    }

    if (
      existing.status ===
      JobCardStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Completed job card cannot be started',
      );
    }

    const updated =
      await this.prisma.jobCard.update({
        where: { id },

        data: {
          status:
            JobCardStatus.IN_PROGRESS,

          startedAt:
            new Date(),
        },
      });

    await this.logEvent({
      productionPlanId:
        updated.productionPlanId,

      jobCardId:
        updated.id,

      eventType:
        'JOB_CARD_STARTED',

      message:
        `Job card ${updated.jobCardNo} started`,
    });

    return updated;
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

    if (
      job.status ===
      JobCardStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Job card already completed',
      );
    }

    if (
      completedWeight >
      job.targetWeight
    ) {
      throw new BadRequestException(
        'Completed weight exceeds target weight',
      );
    }

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          await tx.jobCard.update({
            where: { id },

            data: {
              completedWeight,

              completedAt:
                new Date(),

              status:
                JobCardStatus.COMPLETED,
            },
          });

          const totalCompleted =
            await tx.jobCard.aggregate({
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

          return tx.productionPlan.update({
            where: {
              id:
                job.productionPlanId,
            },

            data: {
              completedWeight:
                completed,

              status,

              actualEndDate:
                status ===
                ProductionPlanStatus.COMPLETED
                  ? new Date()
                  : null,
            },
          });
        },
      );

    await this.logEvent({
      productionPlanId:
        job.productionPlanId,

      jobCardId:
        job.id,

      eventType:
        'JOB_CARD_COMPLETED',

      message:
        `Job card ${job.jobCardNo} completed`,
    });

    await this.lotTrackerService
      .evaluateLot(
        job.productionPlan.lotNo,
      )
      .catch(() => {});

    return result;
  }

  async refreshDelayedStatuses() {
    const today =
      new Date();

    await this.prisma.productionPlan.updateMany({
      where: {
        plannedDate: {
          lt: today,
        },

        status: {
          not:
            ProductionPlanStatus.COMPLETED,
        },
      },

      data: {
        delayed: true,
      },
    });

    await this.prisma.productionPlan.updateMany({
      where: {
        plannedDate: {
          gte: today,
        },
      },

      data: {
        delayed: false,
      },
    });
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
    await this.refreshDelayedStatuses();

    return this.prisma.productionPlan.findMany({
      where: {
        delayed: true,

        status: {
          not:
            ProductionPlanStatus.COMPLETED,
        },
      },

      include: {
        jobCards: true,
      },

      orderBy: {
        plannedDate: 'asc',
      },
    });
  }

  async getPlans({
    page = 1,

    limit = 20,

    status,

    stage,
  }: {
    page?: number;

    limit?: number;

    status?: string;

    stage?: string;
  }) {
    const where: any = {};

    if (status) {
      where.status =
        status as ProductionPlanStatus;
    }

    if (stage) {
      where.stage =
        stage;
    }

    const [data, total] =
      await Promise.all([
        this.prisma.productionPlan.findMany({
          where,

          include: {
            jobCards: true,
          },

          orderBy: {
            plannedDate: 'desc',
          },

          skip:
            (page - 1) * limit,

          take:
            limit,
        }),

        this.prisma.productionPlan.count({
          where,
        }),
      ]);

    return {
      data,

      pagination: {
        total,

        page,

        limit,

        totalPages:
          Math.ceil(total / limit),
      },
    };
  }

  async getJobCards({
    page = 1,

    limit = 20,

    status,
  }: {
    page?: number;

    limit?: number;

    status?: string;
  }) {
    const where: any = {};

    if (status) {
      where.status =
        status as JobCardStatus;
    }

    const [data, total] =
      await Promise.all([
        this.prisma.jobCard.findMany({
          where,

          include: {
            productionPlan: true,
          },

          orderBy: {
            createdAt: 'desc',
          },

          skip:
            (page - 1) * limit,

          take:
            limit,
        }),

        this.prisma.jobCard.count({
          where,
        }),
      ]);

    return {
      data,

      pagination: {
        total,

        page,

        limit,

        totalPages:
          Math.ceil(total / limit),
      },
    };
  }

  async cancelPlan(
    id: number,
  ) {
    const plan =
      await this.prisma.productionPlan.findUnique({
        where: { id },
      });

    if (!plan) {
      throw new BadRequestException(
        'Production plan not found',
      );
    }

    if (
      plan.status ===
      ProductionPlanStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Completed plan cannot be cancelled',
      );
    }

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          await tx.jobCard.updateMany({
            where: {
              productionPlanId: id,

              status: {
                not:
                  JobCardStatus.COMPLETED,
              },
            },

            data: {
              status:
                JobCardStatus.CANCELLED,
            },
          });

          return tx.productionPlan.update({
            where: { id },

            data: {
              status:
                ProductionPlanStatus.CANCELLED,
            },
          });
        },
      );

    await this.logEvent({
      productionPlanId:
        id,

      eventType:
        'PLAN_CANCELLED',

      message:
        `Production plan cancelled`,
    });

    return result;
  }

  async logEvent({
    productionPlanId,
    jobCardId,
    eventType,
    message,
    metadata,
  }: {
    productionPlanId?: number;
    jobCardId?: number;
    eventType: string;
    message: string;
    metadata?: any;
  }) {
    return this.prisma.productionEvent.create({
      data: {
        productionPlanId,
        jobCardId,
        eventType,
        message,
        metadata,
      },
    });
  }

  async reserveProductionInventory({
    lotNo,
    weight,
  }: {
    lotNo: string;
    weight: number;
  }) {
    return this.prisma.inventoryTransaction.create({
      data: {
        referenceType:
          'PRODUCTION_PLAN',
        referenceNumber:
          lotNo,
        transactionType:
          'RESERVED',
        quantity:
          weight,
        remarks:
          'Reserved for production planning',
      },
    });
  }

  async getEvents() {
    return this.prisma.productionEvent.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      take: 100,
    });
  }

  async getSummary() {
    const [
      totalPlans,

      completedPlans,

      delayedPlans,

      inProgressPlans,

      totalWeight,

      completedWeight,
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
          delayed: true,
        },
      }),

      this.prisma.productionPlan.count({
        where: {
          status:
            ProductionPlanStatus.IN_PROGRESS,
        },
      }),

      this.prisma.productionPlan.aggregate({
        _sum: {
          plannedWeight: true,
        },
      }),

      this.prisma.productionPlan.aggregate({
        _sum: {
          completedWeight: true,
        },
      }),
    ]);

    const planned =
      Number(
        totalWeight._sum
          .plannedWeight ?? 0,
      );

    const completed =
      Number(
        completedWeight._sum
          .completedWeight ?? 0,
      );

    return {
      totalPlans,

      completedPlans,

      delayedPlans,

      inProgressPlans,

      plannedWeight:
        planned,

      completedWeight:
        completed,

      efficiency:
        planned > 0
          ? Number(
              (
                (completed /
                  planned) *
                100
              ).toFixed(2),
            )
          : 0,
    };
  }
}
