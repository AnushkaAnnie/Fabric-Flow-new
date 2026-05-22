import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnLotDto, UpdateYarnLotDto } from '@textile-flow/shared';

@Injectable()
export class YarnLotsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create ──────────────────────────────────────────────
  async create(dto: CreateYarnLotDto) {
    const bags = dto.noOfBags || 0;
    const bagWt = dto.bagWeight ?? 60;
    const totalWeight = bags * bagWt;
    const rate = dto.ratePerKg || 0;
    const taxable = totalWeight * rate;
    const cgstPct = dto.cgstRate ?? 2.5;
    const sgstPct = dto.sgstRate ?? 2.5;
    const cgstAmt = taxable * (cgstPct / 100);
    const sgstAmt = taxable * (sgstPct / 100);
    const totalCost = taxable + cgstAmt + sgstAmt;

    return this.prisma.yarnLot.create({
      data: {
        ...dto,
        totalWeight,
        availableWeight: totalWeight,
        ratePerKg: rate,
        totalCost,
        cgstRate: cgstPct,
        sgstRate: sgstPct,
        cgstAmount: cgstAmt,
        sgstAmount: sgstAmt,
      },
      include: { mill: true },
    });
  }

  // ── Find all with optional filters ──────────────────────
  async findAll(filters?: { hfCode?: string; knitterId?: number }) {
    const where: { hfCode?: { contains: string; mode: 'insensitive' } } = {};

    if (filters?.hfCode) {
      where.hfCode = { contains: filters.hfCode, mode: 'insensitive' };
    }

    if (filters?.knitterId) {
      return this.prisma.yarnLot.findMany({
        where: {
          knitterStocks: { some: { knitterId: filters.knitterId } },
          ...where,
        },
        include: {
          mill: true,
          knitterStocks: {
            where: { knitterId: filters.knitterId },
            select: {
              knitter: { select: { id: true, name: true } },
              receivedWeight: true,
              remainingWeight: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.yarnLot.findMany({
      where,
      include: { mill: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Find one ────────────────────────────────────────────
  async findOne(id: number) {
    const lot = await this.prisma.yarnLot.findUnique({
      where: { id },
      include: {
        mill: true,
        yarnReceipts: true,
        knitterStocks: { include: { knitter: true } },
      },
    });
    if (!lot) throw new NotFoundException('Yarn lot not found');
    return lot;
  }

  // ── Update (edit) ───────────────────────────────────────
  async update(id: number, dto: UpdateYarnLotDto) {
    const existing = await this.findOne(id);
    const updateData: Record<string, unknown> = { ...dto };

    if (dto.noOfBags || dto.bagWeight) {
      const bags = dto.noOfBags ?? existing.noOfBags ?? 0;
      const bagWt = dto.bagWeight ?? existing.bagWeight ?? 60;
      updateData.totalWeight = bags * bagWt;
    }
    if (updateData.totalWeight || dto.ratePerKg) {
      const wt = updateData.totalWeight ?? existing.totalWeight;
      const rate = dto.ratePerKg ?? existing.ratePerKg;
      const taxable = wt * rate;
      const cgst = dto.cgstRate ?? existing.cgstRate ?? 0;
      const sgst = dto.sgstRate ?? existing.sgstRate ?? 0;
      const cgstAmount = taxable * (cgst / 100);
      const sgstAmount = taxable * (sgst / 100);
      updateData.cgstAmount = cgstAmount;
      updateData.sgstAmount = sgstAmount;
      updateData.totalCost = taxable + cgstAmount + sgstAmount;
    }

    if (existing.totalWeight === 0 && updateData.totalWeight > 0) {
      updateData.availableWeight = updateData.totalWeight;
    }

    return this.prisma.yarnLot.update({
      where: { id },
      data: updateData,
      include: { mill: true },
    });
  }

  // ── Delete ──────────────────────────────────────────────
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnLot.delete({ where: { id } });
  }

  // ── Issue to Knitter (yarn → knitter stock) ──────────────
  async issue(id: number, knitterId: number, weight: number) {
    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.yarnLot.findUniqueOrThrow({ where: { id } });
      if (lot.availableWeight < weight) {
        throw new BadRequestException(
          `Insufficient inventory. Available: ${lot.availableWeight} kg, requested: ${weight} kg`,
        );
      }

      await tx.yarnLot.update({
        where: { id },
        data: { availableWeight: { decrement: weight } },
      });

      await tx.knitterStock.upsert({
        where: {
          knitterId_yarnLotId: {
            knitterId,
            yarnLotId: id,
          },
        },
        create: {
          knitterId,
          yarnLotId: id,
          receivedWeight: weight,
          remainingWeight: weight,
        },
        update: {
          receivedWeight: { increment: weight },
          remainingWeight: { increment: weight },
        },
      });

      return tx.yarnLot.findUnique({
        where: { id },
        include: { mill: true },
      });
    });
  }
}
