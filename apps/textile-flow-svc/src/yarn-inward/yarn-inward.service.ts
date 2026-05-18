import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnInwardDto } from '@textile-flow/shared';

@Injectable()
export class YarnInwardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnInwardDto) {
    // Default values
    const bagWeight = dto.bagWeight ?? 60;
    const numBags = dto.numBags ?? 0;
    const totalWeight = numBags * bagWeight;

    const ratePerKg = dto.ratePerKg;
    const taxableCost = totalWeight * ratePerKg;

    const cgstRate = dto.cgstRate ?? 2.5;
    const sgstRate = dto.sgstRate ?? 2.5;
    const cgstAmount = taxableCost * (cgstRate / 100);
    const sgstAmount = taxableCost * (sgstRate / 100);
    const totalCost = taxableCost + cgstAmount + sgstAmount;

    // 1. Create inward record
    const inward = await this.prisma.yarnInward.create({
      data: {
        receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
        millId: dto.millId,
        deliveryKnitterId: dto.deliveryKnitterId,
        hfBatch: dto.hfBatch,
        yarnCount: dto.yarnCount,
        yarnQuality: dto.yarnQuality,
        rlVl: dto.rlVl,
        numBags,
        bagWeight,
        totalWeight,
        ratePerKg,
        cgstRate,
        sgstRate,
        cgstAmount,
        sgstAmount,
        totalCost,
        purchaseAccount: dto.purchaseAccount,
        remarks: dto.remarks,
      },
    });

    // 2. Create an empty yarn lot with zero weight
    await this.prisma.yarnLot.create({
      data: {
        hfCode: dto.hfBatch || `HF-${inward.id}`,
        millId: dto.millId,
        totalWeight: 0,
        availableWeight: 0,
        ratePerKg: dto.ratePerKg,
        totalCost: 0,
        yarnInwardId: inward.id,
        description: dto.remarks || '',
        count: dto.yarnCount || '',
      },
    });

    // Return the inward with relations
    return this.prisma.yarnInward.findUnique({
      where: { id: inward.id },
      select: {
        id: true,
        receiptDate: true,
        mill: { select: { id: true, name: true } },
        deliveryKnitter: { select: { id: true, name: true } },
        hfBatch: true,
        yarnCount: true,
        yarnQuality: true,
        rlVl: true,
        numBags: true,
        bagWeight: true,
        totalWeight: true,
        ratePerKg: true,
        cgstRate: true,
        sgstRate: true,
        cgstAmount: true,
        sgstAmount: true,
        totalCost: true,
        purchaseAccount: true,
        remarks: true,
        createdAt: true,
        yarnLots: {
          select: {
            id: true,
            hfCode: true,
            totalWeight: true,
            availableWeight: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.yarnInward.findMany({
      select: {
        id: true,
        receiptDate: true,
        mill: { select: { id: true, name: true } },
        deliveryKnitter: { select: { id: true, name: true } },
        hfBatch: true,
        yarnCount: true,
        yarnQuality: true,
        rlVl: true,
        numBags: true,
        bagWeight: true,
        totalWeight: true,
        ratePerKg: true,
        cgstRate: true,
        sgstRate: true,
        cgstAmount: true,
        sgstAmount: true,
        totalCost: true,
        purchaseAccount: true,
        remarks: true,
        createdAt: true,
        yarnLots: {
          select: {
            id: true,
            hfCode: true,
            totalWeight: true,
            availableWeight: true,
          },
        },
      },
      orderBy: { receiptDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.yarnInward.findUnique({
      where: { id },
      select: {
        id: true,
        receiptDate: true,
        mill: { select: { id: true, name: true } },
        deliveryKnitter: { select: { id: true, name: true } },
        hfBatch: true,
        yarnCount: true,
        yarnQuality: true,
        rlVl: true,
        numBags: true,
        bagWeight: true,
        totalWeight: true,
        ratePerKg: true,
        cgstRate: true,
        sgstRate: true,
        cgstAmount: true,
        sgstAmount: true,
        totalCost: true,
        purchaseAccount: true,
        remarks: true,
        createdAt: true,
        yarnLots: {
          select: {
            id: true,
            hfCode: true,
            totalWeight: true,
            availableWeight: true,
          },
        },
      },
    });
    if (!record) throw new NotFoundException('Yarn inward record not found');
    return record;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnInward.delete({ where: { id } });
  }
}
