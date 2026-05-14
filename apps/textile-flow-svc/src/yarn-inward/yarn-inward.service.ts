import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnInwardDto } from '@textile-flow/shared';

@Injectable()
export class YarnInwardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnInwardDto) {
    const totalWeight = dto.totalWeight; // already validated >0
    const totalCost = totalWeight * (dto.ratePerKg || 0);

    // Atomic: create inward, create yarn lot, auto-issue to delivery knitter
    return this.prisma.$transaction(async (tx) => {
      // 1. Create inward record
      const inward = await tx.yarnInward.create({
        data: {
          receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
          millId: dto.millId,
          deliveryKnitterId: dto.deliveryKnitterId,
          hfBatch: dto.hfBatch,
          yarnCount: dto.yarnCount,
          yarnQuality: dto.yarnQuality,
          totalWeight: totalWeight,
          numBags: dto.numBags,
          ratePerKg: dto.ratePerKg,
          totalCost: totalCost,
          purchaseAccount: dto.purchaseAccount,
          remarks: dto.remarks,
        },
      });

      // 2. Create a yarn lot linked to this inward
      const yarnLot = await tx.yarnLot.create({
        data: {
          hfCode: dto.hfBatch || `HF-${inward.id}`, // auto-generate if needed
          millId: dto.millId,
          totalWeight: totalWeight,
          availableWeight: 0, // will be issued immediately
          numBags: dto.numBags || 0,
          bagWeight: 0, // not relevant for direct inward
          ratePerKg: dto.ratePerKg || 0,
          totalCost: totalCost,
          yarnInwardId: inward.id,
          description: dto.remarks || '',
        },
      });

      // 3. Auto-issue the entire weight to the delivery knitter
      await tx.knitterStock.upsert({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.deliveryKnitterId,
            yarnLotId: yarnLot.id,
          },
        },
        create: {
          knitterId: dto.deliveryKnitterId,
          yarnLotId: yarnLot.id,
          receivedWeight: totalWeight,
          remainingWeight: totalWeight,
        },
        update: {
          receivedWeight: { increment: totalWeight },
          remainingWeight: { increment: totalWeight },
        },
      });

      return tx.yarnInward.findUnique({
        where: { id: inward.id },
        include: { mill: true, deliveryKnitter: true, yarnLots: true },
      });
    });
  }

  async findAll() {
    return this.prisma.yarnInward.findMany({
      include: { mill: true, deliveryKnitter: true, yarnLots: true },
      orderBy: { receiptDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.yarnInward.findUnique({
      where: { id },
      include: { mill: true, deliveryKnitter: true, yarnLots: true },
    });
    if (!record) throw new NotFoundException('Yarn inward record not found');
    return record;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnInward.delete({ where: { id } });
  }
}
