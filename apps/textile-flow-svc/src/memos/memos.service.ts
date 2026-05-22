import { Injectable, BadRequestException } from '@nestjs/common';
import {
  PrismaService,
  type PrismaTransaction,
} from '../prisma/prisma.service';
import { CreateMemoDto } from '@textile-flow/shared';
import { dyeingStatusFromDc } from '../common/adapters/workflow-status.adapter';

@Injectable()
export class MemosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMemoDto) {
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.memo.findFirst({ orderBy: { memoNo: 'desc' } });
      const memoNo = dto.memoNo ?? (last?.memoNo ?? 39) + 1;
      const fallbackDyer =
        dto.dyerId ??
        dto.lines.find((line) => line.preAssignedDyerId)?.preAssignedDyerId ??
        (await tx.dyer.findFirst({ orderBy: { id: 'asc' } }))?.id;

      if (!fallbackDyer) {
        throw new BadRequestException('Dyer is required to create a memo');
      }

      const memo = await tx.memo.create({
        data: {
          memoNo,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
          dyerId: fallbackDyer,
          remarks: dto.remarks,
        },
      });

      for (const line of dto.lines) {
        const resolved = await this.resolveMemoLine(tx, line);
        const lineDyerId = line.preAssignedDyerId ?? fallbackDyer;

        const memoLine = await tx.memoLine.create({
          data: {
            memoId: memo.id,
            knittingLotId: resolved.knittingLotId,
            greyFabricLotId: resolved.greyFabricLotId,
            sentWeight: line.sentWeight ?? resolved.sentWeight,
          },
        });

        await tx.dyeing.create({
          data: {
            lotNo: resolved.lotNo,
            memoLineId: memoLine.id,
            hfCode: resolved.hfCode,
            dyerId: lineDyerId,
            colourId: resolved.colourId,
            initialWeight: line.sentWeight ?? resolved.sentWeight,
            sourceType: resolved.sourceType,
            status: dyeingStatusFromDc(null, null),
            noOfRolls: resolved.noOfRolls,
          },
        });

        if (resolved.greyFabricLotId) {
          await tx.greyFabricLot.update({
            where: { id: resolved.greyFabricLotId },
            data: { status: 'DISPATCHED' },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          tableName: 'memos',
          recordId: String(memo.id),
          action: 'CREATE',
          oldData: undefined,
          newData: { memoNo, lines: dto.lines.length },
          performedBy: 'system',
        },
      });

      return tx.memo.findUnique({
        where: { id: memo.id },
        include: {
          lines: {
            include: {
              knittingLot: {
                include: {
                  entries: { include: { colour: true } },
                  knitting: { include: { knitter: true } },
                },
              },
              greyFabricLot: { include: { knitter: true } },
              dyeing: true,
            },
          },
          dyer: true,
        },
      });
    });
  }

  private async resolveMemoLine(
    tx: PrismaTransaction,
    line: CreateMemoDto['lines'][number],
  ) {
    if (line.knittingLotId) {
      const lot = await tx.knittingLot.findUnique({
        where: { id: line.knittingLotId },
        include: {
          entries: true,
          knitting: {
            include: {
              knitter: true,
              knittingYarnUsages: { include: { yarnLot: true } },
            },
          },
        },
      });
      if (!lot) {
        throw new BadRequestException(
          `Knitting lot ${line.knittingLotId} not found`,
        );
      }

      const weight =
        line.sentWeight ??
        lot.entries.reduce((sum, entry) => sum + entry.weight, 0) ??
        lot.knitting.greyFabricWeight;

      return {
        knittingLotId: lot.id,
        greyFabricLotId: undefined,
        lotNo: lot.lotNo,
        hfCode: lot.knitting.knittingYarnUsages[0]?.hfCode,
        colourId: lot.entries[0]?.colourId ?? (await this.firstColourId(tx)),
        sentWeight: weight,
        noOfRolls: lot.noOfRolls ?? lot.knitting.noOfRolls,
        sourceType: 'KNITTING',
      };
    }

    if (line.greyFabricLotId) {
      const lot = await tx.greyFabricLot.findUnique({
        where: { id: line.greyFabricLotId },
        include: { knitterProgram: { include: { yarnLot: true } } },
      });
      if (!lot) {
        throw new BadRequestException(
          `Grey fabric lot ${line.greyFabricLotId} not found`,
        );
      }

      return {
        knittingLotId: undefined,
        greyFabricLotId: lot.id,
        lotNo: lot.lotNumber,
        hfCode: lot.knitterProgram?.yarnLot.hfCode,
        colourId: await this.firstColourId(tx),
        sentWeight: Number(lot.greyWeight),
        noOfRolls: lot.rollCount ?? undefined,
        sourceType: String(lot.source),
      };
    }

    if (line.yarnLotId && line.knitterId) {
      const yarnLot = await tx.yarnLot.findUnique({
        where: { id: line.yarnLotId },
      });
      if (!yarnLot) {
        throw new BadRequestException(`Yarn lot ${line.yarnLotId} not found`);
      }

      const sentWeight = line.sentWeight ?? yarnLot.availableWeight;
      const greyFabricLot = await tx.greyFabricLot.create({
        data: {
          lotNumber: `GFL-${Date.now()}-${line.yarnLotId}`,
          knitterId: line.knitterId,
          greyWeight: sentWeight,
          rollCount: line.expectedRolls,
          source: 'KNITTED',
          status: 'AVAILABLE',
        },
      });

      return {
        knittingLotId: undefined,
        greyFabricLotId: greyFabricLot.id,
        lotNo: greyFabricLot.lotNumber,
        hfCode: yarnLot.hfCode,
        colourId: await this.firstColourId(tx),
        sentWeight,
        noOfRolls: line.expectedRolls,
        sourceType: 'KNITTING',
      };
    }

    throw new BadRequestException(
      'Memo line requires knittingLotId, greyFabricLotId, or yarnLotId + knitterId',
    );
  }

  private async firstColourId(
    tx: PrismaTransaction,
  ) {
    const colour = await tx.colour.findFirst({ orderBy: { id: 'asc' } });
    if (!colour) throw new BadRequestException('At least one colour is required');
    return colour.id;
  }

  async findAll() {
    return this.prisma.memo.findMany({
      include: {
        lines: {
          include: {
            knittingLot: {
              include: {
                entries: { include: { colour: true } },
                knitting: { include: { knitter: true } },
              },
            },
            greyFabricLot: { include: { knitter: true } },
            dyeing: true,
          },
        },
        dyer: true,
      },
      orderBy: { memoNo: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.memo.findUniqueOrThrow({
      where: { id },
      include: {
        lines: {
          include: {
            knittingLot: true,
            greyFabricLot: true,
            dyeing: true,
          },
        },
        dyer: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.dyeing.deleteMany({ where: { memoLine: { memoId: id } } });
      await tx.memoLine.deleteMany({ where: { memoId: id } });
      return tx.memo.delete({ where: { id } });
    });
  }
}
