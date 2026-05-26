import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async postInventoryMovement(
    {
      entityType,
      entityId,
      itemType,
      inwardWeight,
      outwardWeight,
      referenceNo,
      lotNo,
      stage,
      remarks,
    }: {
      entityType: string;
      entityId: number;
      itemType: string;
      inwardWeight?: number;
      outwardWeight?: number;
      referenceNo?: string;
      lotNo?: string;
      stage?: string;
      remarks?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client: Prisma.TransactionClient | PrismaService = tx || this.prisma;
    const currentBalance = await this.getCurrentBalance(itemType, client);

    const inward = inwardWeight ?? 0;
    const outward = outwardWeight ?? 0;
    const balanceWeight = Number(
      (currentBalance + inward - outward).toFixed(3),
    );

    return client.inventoryLedger.create({
      data: {
        entityType,
        entityId,
        itemType,
        inwardWeight,
        outwardWeight,
        balanceWeight,
        referenceNo,
        lotNo,
        stage,
        remarks,
      },
    });
  }

  async getCurrentBalance(
    itemType: string,
    client?: Prisma.TransactionClient | PrismaService,
  ): Promise<number> {
    const dbClient = client || this.prisma;
    const latest = await dbClient.inventoryLedger.findFirst({
      where: { itemType },
      orderBy: { id: 'desc' },
    });

    return latest?.balanceWeight ?? 0;
  }

  async getInventorySummary() {
    const [yarn, grey, dyed, compact] = await Promise.all([
      this.getCurrentBalance('YARN'),
      this.getCurrentBalance('GREY'),
      this.getCurrentBalance('DYED'),
      this.getCurrentBalance('COMPACT'),
    ]);

    return {
      yarn,
      grey,
      dyed,
      compact,
    };
  }
}
