import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnLotDto, UpdateYarnLotDto } from '@textile-flow/shared';

@Injectable()
export class YarnLotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnLotDto) {
    const totalWeight = dto.numBags * dto.bagWeight;
    const totalCost = totalWeight * dto.ratePerKg;

    return this.prisma.yarnLot.create({
      data: {
        hfCode: dto.hfCode,
        description: dto.description,
        millId: dto.millId,
        count: dto.count,
        numBags: dto.numBags,
        bagWeight: dto.bagWeight,
        ratePerKg: dto.ratePerKg,
        totalWeight,
        totalCost,
        availableWeight: totalWeight,
      },
      include: { mill: true },
    });
  }

  async findAll(filters?: { hfCode?: string; knitterId?: number }) {
    if (filters?.knitterId) {
      return this.prisma.yarnLot.findMany({
        where: {
          knitterStocks: { some: { knitterId: filters.knitterId } },
        },
        include: {
          mill: true,
          knitterStocks: {
            where: { knitterId: filters.knitterId },
            select: { receivedWeight: true, remainingWeight: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const where: Record<string, any> = {};
    if (filters?.hfCode) {
      where['hfCode'] = { contains: filters.hfCode, mode: 'insensitive' };
    }

    return this.prisma.yarnLot.findMany({
      where,
      include: { mill: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const lot = await this.prisma.yarnLot.findUnique({
      where: { id },
      include: { mill: true },
    });
    if (!lot) throw new NotFoundException('Yarn lot not found');
    return lot;
  }

  async update(id: number, dto: UpdateYarnLotDto) {
    const existing = await this.findOne(id);
    const updateData: Record<string, any> = { ...dto };
    if (dto.numBags || dto.bagWeight) {
      const numBags = dto.numBags ?? existing.numBags;
      const bagWeight = dto.bagWeight ?? existing.bagWeight;
      const ratePerKg = dto.ratePerKg ?? existing.ratePerKg;
      const totalWeight = numBags * bagWeight;
      updateData['totalWeight'] = totalWeight;
      updateData['totalCost'] = totalWeight * ratePerKg;
    }
    // If this is the first time we set a weight, make it fully available
    if (existing.totalWeight === 0 && (updateData['totalWeight'] ?? 0) > 0) {
      updateData['availableWeight'] = updateData['totalWeight'];
    }
    return this.prisma.yarnLot.update({
      where: { id },
      data: updateData,
      include: { mill: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnLot.delete({ where: { id } });
  }
}

