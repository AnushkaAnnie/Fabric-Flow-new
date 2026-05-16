import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateDyeingDispatchDto,
  UpdateReceivedWeightDto,
} from '@textile-flow/shared';

@Injectable()
export class DyeingDispatchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDyeingDispatchDto) {
    // Verify all grey lots are AVAILABLE
    const lotIds = dto.lines.map((l) => l.greyFabricLotId);
    const lots = await this.prisma.greyFabricLot.findMany({
      where: { id: { in: lotIds }, status: 'AVAILABLE' },
    });
    if (lots.length !== lotIds.length) {
      throw new BadRequestException('One or more grey lots are not available');
    }

    return this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.dyeingDispatch.create({
        data: {
          dispatchDate: dto.dispatchDate
            ? new Date(dto.dispatchDate)
            : new Date(),
          dyerId: dto.dyerId,
          remarks: dto.remarks,
        },
      });

      for (const lot of lots) {
        await tx.dyeingDispatchLine.create({
          data: {
            dispatchId: dispatch.id,
            greyFabricLotId: lot.id,
            sentWeight: lot.greyWeight,
            status: 'DISPATCHED',
          },
        });

        await tx.greyFabricLot.update({
          where: { id: lot.id },
          data: { status: 'DISPATCHED' },
        });
      }

      return tx.dyeingDispatch.findUnique({
        where: { id: dispatch.id },
        include: {
          dyer: true,
          lines: {
            include: { greyFabricLot: true },
          },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.dyeingDispatch.findMany({
      include: {
        dyer: true,
        lines: {
          include: { greyFabricLot: true },
        },
      },
      orderBy: { dispatchDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const dispatch = await this.prisma.dyeingDispatch.findUnique({
      where: { id },
      include: {
        dyer: true,
        lines: {
          include: { greyFabricLot: true },
        },
      },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return dispatch;
  }

  async updateReceivedWeight(
    dispatchId: number,
    lineId: number,
    dto: UpdateReceivedWeightDto,
  ) {
    const line = await this.prisma.dyeingDispatchLine.findFirst({
      where: { id: lineId, dispatchId },
    });
    if (!line) throw new NotFoundException('Line not found');

    const sentWeight = Number(line.sentWeight);
    const receivedWeight = dto.receivedWeight;
    const lossPercent =
      sentWeight > 0 ? ((sentWeight - receivedWeight) / sentWeight) * 100 : 0;

    return this.prisma.dyeingDispatchLine.update({
      where: { id: lineId },
      data: {
        receivedWeight,
        receivedDate: dto.receivedDate
          ? new Date(dto.receivedDate)
          : new Date(),
        processLossPercent: lossPercent,
        status: 'RECEIVED',
      },
    });
  }
}
