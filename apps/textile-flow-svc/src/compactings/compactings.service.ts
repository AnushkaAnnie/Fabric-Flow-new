import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompactingDto, WorkflowStatus } from '@textile-flow/shared';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';

@Injectable()
export class CompactingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowTransition: WorkflowTransitionService,
  ) {}

  async create(dto: CreateCompactingDto) {
    return this.prisma.$transaction(async (tx) => {
      const dyeing = dto.dyeingId
        ? await tx.dyeing.findUnique({ where: { id: dto.dyeingId } })
        : await tx.dyeing.findUnique({ where: { lotNo: dto.lotNo } });

      if (!dyeing) throw new BadRequestException('Lot not found in dyeing');

      // processLoss = greyWeight (initialWeight from memo) - compactWeight, in kg
      const greyWeight = dyeing.initialWeight;
      const processLoss =
        dto.finalWeight !== undefined
          ? Number((greyWeight - dto.finalWeight).toFixed(3))
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

      // Log compacting creation as a workflow event
      await this.workflowTransition.transition(
        'Compacting',
        compacting.id,
        WorkflowStatus.PENDING,
        WorkflowStatus.COMPLETED,
      );

      await tx.auditLog.create({
        data: {
          tableName: 'compactings',
          recordId: String(compacting.id),
          action: 'CREATE',
          oldData: undefined,
          newData: {
            dyeingId: dyeing.id,
            greyWeight,
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

  async update(id: number, dto: { compactWeight: number }) {
    const compacting = await this.prisma.compacting.findUnique({
      where: { id },
      include: { dyeing: true },
    });

    if (!compacting) {
      throw new NotFoundException('Compacting not found');
    }

    // processLoss = greyWeight - compactWeight in kg
    const greyWeight = compacting.dyeing?.initialWeight ?? 0;
    const processLoss =
      greyWeight > 0 ? Number((greyWeight - dto.compactWeight).toFixed(3)) : 0;

    const updated = await this.prisma.compacting.update({
      where: { id },
      data: {
        finalWeight: dto.compactWeight,
        processLoss,
      },
      include: { compacter: true, colour: true, dyeing: true },
    });

    // Log weight update as a workflow event
    await this.workflowTransition.transition(
      'Compacting',
      id,
      WorkflowStatus.PENDING,
      WorkflowStatus.COMPLETED,
    );

    return updated;
  }
}
