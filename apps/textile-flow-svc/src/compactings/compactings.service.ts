import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompactingDto } from '@textile-flow/shared';

@Injectable()
export class CompactingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompactingDto) {
    return this.prisma.$transaction(async (tx) => {
      const dyeing = dto.dyeingId
        ? await tx.dyeing.findUnique({ where: { id: dto.dyeingId } })
        : await tx.dyeing.findUnique({ where: { lotNo: dto.lotNo } });

      if (!dyeing) throw new BadRequestException('Lot not found in dyeing');

      const processLoss = dto.finalWeight
        ? ((dyeing.initialWeight - dto.finalWeight) / dyeing.initialWeight) *
          100
        : undefined;

      const compacting = await tx.compacting.create({
        data: {
          lotNo: dto.lotNo,
          dyeingId: dyeing.id,
          compacterId: dto.compacterId ?? dyeing.compacterId,
          colourId: dto.colourId ?? dyeing.colourId,
          finalWeight: dto.finalWeight,
          processLoss,
        },
        include: { compacter: true, colour: true, dyeing: true },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'compactings',
          recordId: String(compacting.id),
          action: 'CREATE',
          oldData: undefined,
          newData: {
            dyeingId: dyeing.id,
            greyWeight: dyeing.initialWeight,
            compactWeight: dto.finalWeight,
            processLoss,
          },
          performedBy: 'system',
        },
      });

      return compacting;
    });
  }

  async findAll() {
    return this.prisma.compacting.findMany({
      include: { compacter: true, colour: true, dyeing: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
