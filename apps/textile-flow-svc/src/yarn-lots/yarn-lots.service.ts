import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateYarnLotDto,
  IssueYarnDto,
  UpdateYarnLotDto,
} from '@textile-flow/shared';
import { lockYarnLot } from '../common/locks';

@Injectable()
export class YarnLotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateYarnLotDto) {
    const totalWeight = dto.numBags * dto.bagWeight;
    const totalCost = totalWeight * dto.ratePerKg;

    return this.prisma.yarnLot.create({
      data: {
        hfCode: dto.hfCode,
        description: dto.description,
        millId: dto.millId,
        count: dto.count,
        qualityId: dto.qualityId,
        numBags: dto.numBags,
        bagWeight: dto.bagWeight,
        ratePerKg: dto.ratePerKg,
        totalWeight,
        totalCost,
        availableWeight: totalWeight,
      },
      include: { mill: true },
    });
  }

  async findAll() {
    return this.prisma.yarnLot.findMany({
      include: { mill: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const lot = await this.prisma.yarnLot.findUnique({
      where: { id },
      include: { mill: true },
    });
    if (!lot) throw new NotFoundException('Yarn lot not found');
    return lot;
  }

  async update(id: number, dto: UpdateYarnLotDto) {
    const existing = await this.findOne(id);
    const updateData: Record<string, any> = { ...dto };
    if (dto.numBags || dto.bagWeight) {
      const numBags = dto.numBags ?? existing.numBags;
      const bagWeight = dto.bagWeight ?? existing.bagWeight;
      const ratePerKg = dto.ratePerKg ?? existing.ratePerKg;
      const totalWeight = numBags * bagWeight;
      updateData['totalWeight'] = totalWeight;
      updateData['totalCost'] = totalWeight * ratePerKg;
      // NEVER adjust availableWeight here
    }
    return this.prisma.yarnLot.update({
      where: { id },
      data: updateData,
      include: { mill: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnLot.delete({ where: { id } });
  }

  async issue(id: number, dto: IssueYarnDto) {
    return this.prisma.$transaction(async (tx) => {
      const yarn = await lockYarnLot(tx, id);
      if (!yarn) throw new NotFoundException('Yarn lot not found');
      if (yarn.available_weight < dto.weight) {
        throw new BadRequestException(
          `Insufficient inventory. Available: ${yarn.available_weight} kg, requested: ${dto.weight} kg`,
        );
      }

      await tx.yarnLot.update({
        where: { id },
        data: { availableWeight: { decrement: dto.weight } },
      });

      await tx.knitterStock.upsert({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.knitterId,
            yarnLotId: id,
          },
        },
        create: {
          knitterId: dto.knitterId,
          yarnLotId: id,
          receivedWeight: dto.weight,
          remainingWeight: dto.weight,
        },
        update: {
          receivedWeight: { increment: dto.weight },
          remainingWeight: { increment: dto.weight },
        },
      });

      return tx.yarnLot.findUnique({
        where: { id },
        include: { mill: true },
      });
    });
  }
}
