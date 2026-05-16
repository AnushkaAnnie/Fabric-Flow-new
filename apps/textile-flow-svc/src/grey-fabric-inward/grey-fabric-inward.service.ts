import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGreyFabricInwardDto } from '@textile-flow/shared';

@Injectable()
export class GreyFabricInwardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGreyFabricInwardDto) {
    const totalCost = (dto.totalWeight || 0) * (dto.ratePerKg || 0);

    // Create the inward record and an associated grey fabric lot (AVAILABLE)
    return this.prisma.$transaction(async (tx) => {
      const inward = await tx.greyFabricInward.create({
        data: {
          receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
          supplierName: dto.supplierName,
          fabricType: dto.fabricType,
          colour: dto.colour,
          totalWeight: dto.totalWeight,
          rollCount: dto.rollCount,
          ratePerKg: dto.ratePerKg,
          totalCost,
          purchaseAccount: dto.purchaseAccount,
          remarks: dto.remarks,
        },
      });

      // Automatically create a GreyFabricLot for the received material
      await tx.greyFabricLot.create({
        data: {
          lotNumber: `PUR-${inward.id}`, // simple auto-generated lot number
          greyWeight: dto.totalWeight,
          rollCount: dto.rollCount || 0,
          source: 'PURCHASED',
          status: 'AVAILABLE',
          greyFabricInwardId: inward.id,
        },
      });

      return tx.greyFabricInward.findUnique({
        where: { id: inward.id },
        include: { greyFabricLots: true },
      });
    });
  }

  async findAll() {
    return this.prisma.greyFabricInward.findMany({
      include: { greyFabricLots: true },
      orderBy: { receiptDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.greyFabricInward.findUnique({
      where: { id },
      include: { greyFabricLots: true },
    });
    if (!record)
      throw new NotFoundException('Grey fabric inward record not found');
    return record;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.greyFabricInward.delete({ where: { id } });
  }
}
