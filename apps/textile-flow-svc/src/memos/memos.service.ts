import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemoDto } from '@textile-flow/shared';

@Injectable()
export class MemosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMemoDto) {
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.memo.findFirst({ orderBy: { memoNo: 'desc' } });
      const memoNo = (last?.memoNo ?? 39) + 1;

      const memo = await tx.memo.create({
        data: {
          memoNo,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
          dyerId: dto.dyerId,
          remarks: dto.remarks,
        },
      });

      for (const line of dto.lines) {
        const lot = await tx.knittingLot.findUnique({
          where: { id: line.knittingLotId },
          include: { entries: true },
        });
        if (!lot) throw new BadRequestException(`Knitting lot ${line.knittingLotId} not found`);

        const memoLine = await tx.memoLine.create({
          data: {
            memoId: memo.id,
            knittingLotId: line.knittingLotId,
            sentWeight: line.sentWeight,
          },
        });

        await tx.dyeing.create({
          data: {
            lotNo: `DYE-${memoLine.id}`,
            memoLineId: memoLine.id,
            dyerId: dto.dyerId,
            colourId: lot.entries[0]?.colourId ?? 1,
            initialWeight: line.sentWeight,
            sourceType: 'KNITTING',
            status: 'Awaiting DC',
          },
        });
      }

      return tx.memo.findUnique({
        where: { id: memo.id },
        include: { lines: { include: { knittingLot: true, dyeing: true } }, dyer: true },
      });
    });
  }

  async findAll() {
    return this.prisma.memo.findMany({
      include: { lines: { include: { knittingLot: true, dyeing: true } }, dyer: true },
      orderBy: { memoNo: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.memo.findUniqueOrThrow({
      where: { id },
      include: { lines: { include: { knittingLot: true, dyeing: true } }, dyer: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.memoLine.deleteMany({ where: { memoId: id } });
      return tx.memo.delete({ where: { id } });
    });
  }
}
