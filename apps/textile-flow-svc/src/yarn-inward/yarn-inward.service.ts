import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateYarnInwardDto } from '@textile-flow/shared';
import { CreateYarnInwardDto } from '@textile-flow/shared';

@Injectable()
export class YarnInwardService {
  constructor(private readonly prisma: PrismaService) { }

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

  async update(id: number, dto: UpdateYarnInwardDto) {
    const existing = await this.prisma.yarnInward.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Yarn inward record not found');

    // Recalculate derived fields from updated inputs (or keep existing values)
    const numBags = dto.numBags ?? existing.numBags ?? 0;
    const bagWeight = dto.bagWeight
      ? Number(dto.bagWeight)
      : Number(existing.bagWeight ?? 60);
    const ratePerKg = dto.ratePerKg
      ? Number(dto.ratePerKg)
      : Number(existing.ratePerKg ?? 0);
    const totalWeight = numBags * bagWeight;
    const taxableCost = totalWeight * ratePerKg;
    const cgstRate =
      dto.cgstRate !== undefined
        ? Number(dto.cgstRate)
        : Number(existing.cgstRate ?? 2.5);
    const sgstRate =
      dto.sgstRate !== undefined
        ? Number(dto.sgstRate)
        : Number(existing.sgstRate ?? 2.5);
    const cgstAmount = taxableCost * (cgstRate / 100);
    const sgstAmount = taxableCost * (sgstRate / 100);
    const totalCost = taxableCost + cgstAmount + sgstAmount;

    return this.prisma.yarnInward.update({
      where: { id },
      data: {
        receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : undefined,
        millId: dto.millId,
        deliveryKnitterId: dto.deliveryKnitterId,
        hfBatch: dto.hfBatch,
        yarnCount: dto.yarnCount,
        yarnQuality: dto.yarnQuality,
        rlVl: dto.rlVl,
        purchaseAccount: dto.purchaseAccount,
        remarks: dto.remarks,
        numBags,
        bagWeight,
        totalWeight,
        ratePerKg,
        cgstRate,
        sgstRate,
        cgstAmount,
        sgstAmount,
        totalCost,
      },
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

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnInward.delete({ where: { id } });
  }
}
