import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnInwardDto } from '@textile-flow/shared';

@Injectable()
export class YarnInwardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnInwardDto) {
    // 1. Create inward record (invoice details only – no weight yet)
    const inward = await this.prisma.yarnInward.create({
      data: {
        receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
        millId: dto.millId,
        deliveryKnitterId: dto.deliveryKnitterId, // optional, set later
        hfBatch: dto.hfBatch,
        yarnCount: dto.yarnCount,
        yarnQuality: dto.yarnQuality,
        totalWeight: 0, // no physical weight yet
        numBags: 0,
        ratePerKg: dto.ratePerKg,
        totalCost: 0,
        purchaseAccount: dto.purchaseAccount,
        remarks: dto.remarks,
      },
    });

    // 2. Create an empty yarn lot – only HF code/description, no quantity
    await this.prisma.yarnLot.create({
      data: {
        hfCode: dto.hfBatch || `HF-${inward.id}`,
        millId: dto.millId,
        totalWeight: 0,
        availableWeight: 0,
        numBags: 0,
        bagWeight: 0,
        ratePerKg: dto.ratePerKg || 0,
        totalCost: 0,
        yarnInwardId: inward.id,
        description: dto.remarks || '',
      },
    });

    // 3. Return the inward record (no auto-issue)
    return this.prisma.yarnInward.findUnique({
      where: { id: inward.id },
      include: { mill: true, deliveryKnitter: true, yarnLots: true },
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
