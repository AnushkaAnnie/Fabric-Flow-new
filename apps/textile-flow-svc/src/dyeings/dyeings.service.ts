import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDyeingDto } from '@textile-flow/shared';

@Injectable()
export class DyeingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dyeing.findMany({
      include: { dyer: true, colour: true, washType: true, compacter: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const dyeing = await this.prisma.dyeing.findUnique({
      where: { id },
      include: { dyer: true, colour: true, washType: true, compacter: true },
    });
    if (!dyeing) throw new NotFoundException('Dyeing record not found');
    return dyeing;
  }

  async update(id: number, dto: UpdateDyeingDto) {
    const existing = await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };

    if (dto.finalWeight !== undefined) {
      const initial = dto.initialWeight ?? existing.initialWeight;
      data.processLoss = ((initial - dto.finalWeight) / initial) * 100;
    }

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
