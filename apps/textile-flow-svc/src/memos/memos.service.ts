import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemoDto } from '@textile-flow/shared';

@Injectable()
export class MemosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMemoDto) {
    // Auto-increment memo number
    const lastMemo = await this.prisma.memo.findFirst({
      orderBy: { memoNo: 'desc' },
    });
    const nextMemoNo = (lastMemo?.memoNo ?? 39) + 1; // starts at 40 as per sheet

    return this.prisma.$transaction(async (tx) => {
      const memo = await tx.memo.create({
        data: {
          memoNo: nextMemoNo,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
          programmeRef: dto.programmeRef,
          account: dto.account || 'C.N.T.LLP',
          remarks: dto.remarks,
        },
      });

      // Create memo lines
      for (const line of dto.lines) {
        await tx.memoLine.create({
          data: {
            memoId: memo.id,
            yarnLotId: line.yarnLotId,
            knitterId: line.knitterId,
            yarnCount: line.yarnCount,
            dia: line.dia,
            gg: line.gg,
            loopLength: line.loopLength,
            fabricName: line.fabricName,
            fabricColour: line.fabricColour,
            expectedRolls: line.expectedRolls,
            preAssignedDyerId: line.preAssignedDyerId,
          },
        });
      }

      return tx.memo.findUnique({
        where: { id: memo.id },
        include: { lines: { include: { yarnLot: true, knitter: true } } },
      });
    });
  }

  async findAll() {
    return this.prisma.memo.findMany({
      include: { lines: { include: { yarnLot: true, knitter: true } } },
      orderBy: { memoNo: 'desc' },
    });
  }

  async findOne(id: number) {
    const memo = await this.prisma.memo.findUnique({
      where: { id },
      include: { lines: { include: { yarnLot: true, knitter: true } } },
    });
    if (!memo) throw new NotFoundException('Memo not found');
    return memo;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.memo.delete({ where: { id } });
  }
}
