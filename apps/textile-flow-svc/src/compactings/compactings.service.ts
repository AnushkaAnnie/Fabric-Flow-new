import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompactingDto } from '@textile-flow/shared';

@Injectable()
export class CompactingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompactingDto) {
    const dyeing = await this.prisma.dyeing.findUnique({
      where: { lotNo: dto.lotNo },
    });
    if (!dyeing) throw new BadRequestException('Lot not found in dyeing');

    const processLoss = dto.finalWeight
      ? ((dyeing.initialWeight - dto.finalWeight) / dyeing.initialWeight) * 100
      : undefined;

    return this.prisma.compacting.create({
      data: {
        ...dto,
        processLoss,
      },
      include: { compacter: true, colour: true },
    });
  }

  async findAll() {
    return this.prisma.compacting.findMany({
      include: { compacter: true, colour: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
