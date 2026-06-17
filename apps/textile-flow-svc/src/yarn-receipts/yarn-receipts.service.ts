import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYarnReceiptDto } from '@textile-flow/shared';

@Injectable()
export class YarnReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnReceiptDto) {
    const yarnLot = await this.prisma.yarnLot.findUnique({
      where: { id: dto.yarnLotId },
    });
    if (!yarnLot) throw new NotFoundException('Yarn lot not found');

    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.yarnReceipt.create({
        data: {
          yarnLotId: dto.yarnLotId,
          quantity: dto.quantity,
          receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
          dcNo: dto.dcNo,
        },
      });

      await tx.yarnLot.update({
        where: { id: dto.yarnLotId },
        data: { availableWeight: { increment: dto.quantity } },
      });

      return receipt;
    });
  }

  async findAll() {
    return this.prisma.yarnReceipt.findMany({
      include: { yarnLot: true },
      orderBy: { receiptDate: 'desc' },
    });
  }
}
