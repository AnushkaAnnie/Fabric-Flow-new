import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDyeingDto } from '@textile-flow/shared';
import { Prisma, Dyeing } from '@prisma/client';
import { dyeingStatusFromDc } from '../common/adapters/workflow-status.adapter';

@Injectable()
export class DyeingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dyeing.findMany({
      include: {
        dyer: true,
        colour: true,
        washType: true,
        compacter: true,
        memoLine: {
          include: {
            memo: true,
            knittingLot: {
              include: {
                knitting: { include: { knitter: true } },
                entries: { include: { colour: true } },
              },
            },
            greyFabricLot: { include: { knitter: true } },
          },
        },
      },
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

    const knitterDcNo =
      dto.knitterDcNo !== undefined ? dto.knitterDcNo : existing.knitterDcNo;
    const companyDcNo =
      dto.companyDcNo !== undefined ? dto.companyDcNo : existing.companyDcNo;

    if (dto.status === undefined) {
      data.status = dyeingStatusFromDc(knitterDcNo, companyDcNo);
    }

    if (dto.finalWeight !== undefined) {
      data.status = 'Completed';
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.dyeing.update({
        where: { id },
        data,
        include: { dyer: true, colour: true, washType: true, compacter: true },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'dyeings',
          recordId: String(id),
          action: 'UPDATE',
          oldData: {
            status: existing.status,
            finalWeight: existing.finalWeight,
            processLoss: existing.processLoss,
            knitterDcNo: existing.knitterDcNo,
            companyDcNo: existing.companyDcNo,
          },
          newData: data as Prisma.InputJsonObject,
          performedBy: 'system',
        },
      });

      return updated;
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.dyeing.delete({ where: { id } });
  }
}
