import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnitterStockService {
  constructor(private readonly prisma: PrismaService) {}

  findByKnitter(knitterId: string) {
    return this.prisma.knitterStock.findMany({
      where: { knitterId },
      include: { yarnLot: true },
    });
  }
}
