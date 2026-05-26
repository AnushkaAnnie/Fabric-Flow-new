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
          // Start as PENDING — caller must call completeCompacting() to finalize
          status: WorkflowStatus.PENDING,
        },
        include: { compacter: true, colour: true, dyeing: true },
      });

      // Log compacting creation as a workflow event (PENDING)
      await this.workflowTransition.transition(
        'Compacting',
        compacting.id,
        '',
        WorkflowStatus.PENDING,
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
            status: WorkflowStatus.PENDING,
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

  /**
   * Completes a compacting operation.
   * Process loss is calculated from the original GREY FABRIC weight, not the dyed weight.
   */
  async completeCompacting(compactingId: number, finalWeight: number) {
    return this.prisma.$transaction(async (tx) => {
      const compacting = await tx.compacting.findUnique({
        where: { id: compactingId },
        include: { dyeing: true },
      });

      if (!compacting) {
        throw new NotFoundException('Compacting not found');
      }

      if (!compacting.dyeing) {
        throw new BadRequestException(
          'Compacting has no associated dyeing record',
        );
      }

      // Business rule: process loss is from grey fabric weight, not dyed weight
      const greyWeight = compacting.dyeing.initialWeight;
      const processLoss =
        greyWeight > 0 ? Number((greyWeight - finalWeight).toFixed(3)) : 0;

      const oldStatus = compacting.status ?? WorkflowStatus.PENDING;

      const updated = await tx.compacting.update({
        where: { id: compactingId },
        data: {
          finalWeight,
          processLoss,
          status: WorkflowStatus.COMPLETED,
        },
        include: { compacter: true, colour: true, dyeing: true },
      });

      await this.workflowTransition.transition(
        'Compacting',
        compacting.id,
        oldStatus,
        WorkflowStatus.COMPLETED,
      );

      return updated;
    });
  }

  /**
   * @deprecated Use completeCompacting() for explicit lifecycle management.
   * Kept for backwards compatibility with existing update route.
   */
  async update(id: number, dto: { compactWeight: number }) {
    return this.completeCompacting(id, dto.compactWeight);
  }
}
