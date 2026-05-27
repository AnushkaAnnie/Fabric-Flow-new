import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LotStatus } from '@textile-flow/shared';
import { WorkflowStatus } from '@textile-flow/shared';

const DELAY_THRESHOLD_DAYS = 7;

@Injectable()
export class LotTrackerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates and persists the current status of a lot by aggregating
   * knitting, dyeing, and compacting records.
   * NOTE: Knitting is linked via KnittingLot.lotNo, not Knitting.lotNo (which does not exist).
   */
  async evaluateLot(lotNo: string) {
    if (!lotNo) {
      throw new BadRequestException('Lot number is required');
    }

    // Knitting records are found via KnittingLot (which holds the lotNo)
    const knittingLots = await this.prisma.knittingLot.findMany({
      where: { lotNo },
      include: { knitting: true },
      orderBy: { createdAt: 'asc' },
    });
    const knittings = knittingLots.map((kl) => kl.knitting);

    // Dyeing records have lotNo directly
    const dyeings = await this.prisma.dyeing.findMany({
      where: { lotNo },
      orderBy: { createdAt: 'asc' },
    });

    // Compactings are linked via their dyeing record's lotNo
    const compactings = await this.prisma.compacting.findMany({
      where: { dyeing: { lotNo } },
      include: { dyeing: true },
      orderBy: { createdAt: 'asc' },
    });

    // ---- Determine current status ----
    let currentStatus: string = LotStatus.PENDING;
    let activeStage: string | null = null;

    if (knittings.length > 0) {
      currentStatus = LotStatus.IN_KNITTING;
      activeStage = 'KNITTING';
    }
    if (dyeings.length > 0) {
      currentStatus = LotStatus.IN_DYEING;
      activeStage = 'DYEING';
    }
    if (compactings.length > 0) {
      currentStatus = LotStatus.IN_COMPACTING;
      activeStage = 'COMPACTING';
    }

    // ---- Weight calculations ----
    const totalWeight = knittings.reduce(
      (sum, k) => sum + Number(k.receivedWeight ?? k.greyFabricWeight ?? 0),
      0,
    );

    const completedWeight = compactings.reduce(
      (sum, c) => sum + Number(c.finalWeight ?? 0),
      0,
    );

    const balanceWeight = Number(
      Math.max(totalWeight - completedWeight, 0).toFixed(3),
    );

    let completionPercent = 0;
    if (totalWeight > 0) {
      completionPercent = Number(
        Math.min((completedWeight / totalWeight) * 100, 100).toFixed(2),
      );
    }

    // ---- Partial / Completed detection ----
    const completedCompactings = compactings.filter(
      (c) => c.status === WorkflowStatus.COMPLETED,
    );

    if (completedWeight > 0 && completedWeight < totalWeight) {
      currentStatus = LotStatus.PARTIAL;
    }

    if (
      compactings.length > 0 &&
      completedCompactings.length === compactings.length &&
      dyeings.every((d) => d.status === WorkflowStatus.COMPLETED)
    ) {
      currentStatus = LotStatus.COMPLETED;
      activeStage = 'COMPLETED';
    }

    // ---- Delay detection ----
    const latestDates = [
      ...knittings.map((x) => x.updatedAt),
      ...dyeings.map((x) => x.updatedAt),
      ...compactings.map((x) => x.updatedAt),
    ].filter(Boolean) as Date[];

    const latestActivity =
      latestDates.length > 0
        ? latestDates.sort((a, b) => b.getTime() - a.getTime())[0]
        : null;

    const delayed =
      currentStatus !== LotStatus.COMPLETED &&
      currentStatus !== LotStatus.CANCELLED &&
      latestActivity !== null
        ? this.isDelayed(latestActivity)
        : false;

    // ---- Upsert the tracker record ----
    return this.prisma.lotTracker.upsert({
      where: { lotNo },
      create: {
        lotNo,
        currentStatus,
        activeStage,
        completionPercent,
        totalWeight,
        completedWeight,
        balanceWeight,
        delayed,
        startedAt: knittingLots[0]?.createdAt ?? null,
        completedAt:
          currentStatus === LotStatus.COMPLETED ? new Date() : null,
        lastActivityAt: latestActivity,
      },
      update: {
        currentStatus,
        activeStage,
        completionPercent,
        totalWeight,
        completedWeight,
        balanceWeight,
        delayed,
        completedAt:
          currentStatus === LotStatus.COMPLETED ? new Date() : null,
        lastActivityAt: latestActivity,
      },
    });
  }

  private isDelayed(lastActivity: Date): boolean {
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > DELAY_THRESHOLD_DAYS;
  }

  /** Return all lot tracker records */
  async findAll() {
    return this.prisma.lotTracker.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Return a single lot tracker by lotNo */
  async findByLotNo(lotNo: string) {
    const tracker = await this.prisma.lotTracker.findUnique({
      where: { lotNo },
    });
    if (!tracker) throw new NotFoundException(`Lot tracker for ${lotNo} not found`);
    return tracker;
  }

  /** Return all delayed lots */
  async findDelayed() {
    return this.prisma.lotTracker.findMany({
      where: { delayed: true },
      orderBy: { lastActivityAt: 'asc' },
    });
  }

  /** Return all lots currently in a given stage */
  async findByStage(stage: string) {
    return this.prisma.lotTracker.findMany({
      where: { activeStage: stage.toUpperCase() },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
