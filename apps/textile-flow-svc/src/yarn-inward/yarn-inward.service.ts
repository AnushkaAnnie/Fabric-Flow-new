import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnInwardDto } from '@textile-flow/shared';

@Injectable()
export class YarnInwardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnInwardDto) {
    const totalCost = (dto.totalWeight || 0) * (dto.ratePerKg || 0);
    return this.prisma.yarnInward.create({
      data: {
        receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
        millId: dto.millId,
        hfBatch: dto.hfBatch,
        yarnCount: dto.yarnCount,
        yarnQuality: dto.yarnQuality,
        totalWeight: dto.totalWeight,
        numBags: dto.numBags,
        ratePerKg: dto.ratePerKg,
        totalCost: totalCost,
        purchaseAccount: dto.purchaseAccount,
        remarks: dto.remarks,
      },
      include: { mill: true },
    });
  }

  async findAll() {
    return this.prisma.yarnInward.findMany({
      include: { mill: true },
      orderBy: { receiptDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.yarnInward.findUnique({
      where: { id },
      include: { mill: true, yarnLots: true },
    });
    if (!record) throw new NotFoundException('Yarn inward record not found');
    return record;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnInward.delete({ where: { id } });
  }
}
