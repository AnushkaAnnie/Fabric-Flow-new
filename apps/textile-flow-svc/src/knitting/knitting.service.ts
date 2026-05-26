import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowStatus } from '@textile-flow/shared';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';

@Injectable()
export class KnittingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowTransition: WorkflowTransitionService,
  ) {}

  /**
   * Records the received grey fabric weight for a knitting batch.
   * Shortage = greyFabricWeight (expected) - receivedWeight (actual).
   * Transitions status to RECEIVED and logs the workflow event.
   */
  async receiveYarn(knittingId: number, receivedWeight: number) {
    return this.prisma.$transaction(async (tx) => {
      const knitting = await tx.knitting.findUnique({
        where: { id: knittingId },
      });

      if (!knitting) {
        throw new NotFoundException('Knitting entry not found');
      }

      // greyFabricWeight is the expected issued output weight
      const shortage = Number(
        (knitting.greyFabricWeight - receivedWeight).toFixed(3),
      );

      const updated = await tx.knitting.update({
        where: { id: knittingId },
        data: {
          receivedWeight,
          shortage,
          status: WorkflowStatus.RECEIVED,
        },
      });

      await this.workflowTransition.transition(
        'Knitting',
        knitting.id,
        knitting.status ?? WorkflowStatus.PENDING,
        WorkflowStatus.RECEIVED,
      );

      return updated;
    });
  }

  async findAll() {
    return this.prisma.knitting.findMany({
      include: {
        knitter: true,
        knittingYarnUsages: { include: { yarnLot: true } },
        knittingLots: { include: { entries: { include: { colour: true } } } },
      },
      orderBy: { dateGiven: 'desc' },
    });
  }

  async findOne(id: number) {
    const knitting = await this.prisma.knitting.findUnique({
      where: { id },
      include: {
        knitter: true,
        knittingYarnUsages: { include: { yarnLot: true } },
        knittingLots: { include: { entries: { include: { colour: true } } } },
      },
    });
    if (!knitting) throw new NotFoundException('Knitting not found');
    return knitting;
  }
}
