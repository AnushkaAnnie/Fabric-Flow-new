import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDyeingDto } from '@textile-flow/shared';
import { Prisma, Dyeing } from '@prisma/client';

@Injectable()
export class DyeingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dyeing.findMany({
      include: { dyer: true, colour: true, washType: true, compacter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Dyeing & { dyer?: any; colour?: any; washType?: any; compacter?: any }> {
    const dyeing = await this.prisma.dyeing.findUnique({
      where: { id },
      include: { dyer: true, colour: true, washType: true, compacter: true },
    });
    if (!dyeing) throw new NotFoundException('Dyeing record not found');
    return dyeing;
  }

  async update(id: number, dto: UpdateDyeingDto) {
    const existing = await this.findOne(id);

    // Use UncheckedUpdateInput so we can set scalar FKs (compacterId, washTypeId) directly
    const data: Prisma.DyeingUncheckedUpdateInput = {};

    if (dto.initialWeight !== undefined) data.initialWeight = dto.initialWeight;
    if (dto.finalWeight !== undefined) data.finalWeight = dto.finalWeight;
    if (dto.knitterDcNo !== undefined) data.knitterDcNo = dto.knitterDcNo;
    if (dto.companyDcNo !== undefined) data.companyDcNo = dto.companyDcNo;
    if (dto.compacterId !== undefined) data.compacterId = Number(dto.compacterId);
    if (dto.washTypeId !== undefined) data.washTypeId = Number(dto.washTypeId);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.dateGiven !== undefined) data.dateGiven = new Date(dto.dateGiven);

    // Process loss calculation
    if (dto.finalWeight !== undefined) {
      const initial = dto.initialWeight ?? existing.initialWeight;
      if (initial > 0) {
        data.processLoss = ((initial - dto.finalWeight) / initial) * 100;
      }
    }

    // Auto-set status when company DC and date are present
    if (dto.companyDcNo && (dto.dateGiven || existing.dateGiven)) {
      data.status = 'In Dyeing';
    }

    return this.prisma.dyeing.update({
      where: { id },
      data,
      include: { dyer: true, colour: true, washType: true, compacter: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.dyeing.delete({ where: { id } });
  }
}
