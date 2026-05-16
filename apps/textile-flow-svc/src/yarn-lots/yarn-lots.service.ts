import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnLotDto, UpdateYarnLotDto } from '@textile-flow/shared';

@Injectable()
export class YarnLotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnLotDto) {
    const totalCost = dto.totalWeight * dto.ratePerKg;

    return this.prisma.yarnLot.create({
      data: {
        hfCode: dto.hfCode,
        description: dto.description,
        millId: dto.millId,
        count: dto.count,
        ratePerKg: dto.ratePerKg,
        totalWeight: dto.totalWeight,
        totalCost,
        availableWeight: dto.totalWeight,
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
            select: {
              knitter: { select: { name: true } },
              receivedWeight: true,
              remainingWeight: true,
            },
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

    if (dto.totalWeight) {
      updateData['totalCost'] =
        dto.totalWeight * (dto.ratePerKg ?? existing.ratePerKg);

      // if weight was zero and is now positive, it means physical receipt
      if (existing.totalWeight === 0 && dto.totalWeight > 0) {
        updateData['availableWeight'] = dto.totalWeight;
      }
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
