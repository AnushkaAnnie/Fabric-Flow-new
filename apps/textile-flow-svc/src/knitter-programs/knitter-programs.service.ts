import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateKnitterProgramBody = {
  knitterId: number;
  yarnLotId: number;
  quantityUsed: number;
  greyWeight: number;
  numRolls?: number;
  dia?: string;
  gg?: string;
  loopLength?: string;
  fabricName?: string;
  fabricColour?: string;
  programmeRef?: string;
  preAssignedDyerId?: number;
  programDate?: string;
  blendType?: string;
  blendPercent?: number;
};

@Injectable()
export class KnitterProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateKnitterProgramBody) {
    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.knitterStock.findUnique({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.knitterId,
            yarnLotId: dto.yarnLotId,
          },
        },
      });

      if (!stock || stock.remainingWeight < dto.quantityUsed) {
        throw new BadRequestException('Insufficient yarn stock at knitter');
      }

      await tx.knitterStock.update({
        where: { id: stock.id },
        data: { remainingWeight: { decrement: dto.quantityUsed } },
      });

      const program = await tx.knitterProgram.create({
        data: {
          knitterId: dto.knitterId,
          yarnLotId: dto.yarnLotId,
          quantityUsed: dto.quantityUsed,
          greyWeight: dto.greyWeight,
          numRolls: dto.numRolls,
          dia: dto.dia,
          gg: dto.gg,
          loopLength: dto.loopLength,
          fabricName: dto.fabricName,
          fabricColour: dto.fabricColour,
          programmeRef: dto.programmeRef,
          preAssignedDyerId: dto.preAssignedDyerId,
          blendType: dto.blendType,
          blendPercent: dto.blendPercent,
          anomalyFlag: dto.greyWeight > dto.quantityUsed,
          programDate: dto.programDate ? new Date(dto.programDate) : new Date(),
        },
      });

      await tx.greyFabricLot.create({
        data: {
          lotNumber: dto.programmeRef || `GFL-${program.id}`,
          knitterProgramId: program.id,
          knitterId: dto.knitterId,
          greyWeight: dto.greyWeight,
          rollCount: dto.numRolls,
          source: 'KNITTED',
          status: 'AVAILABLE',
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'knitter_programs',
          recordId: String(program.id),
          action: 'CREATE',
          oldData: { stockRemaining: stock.remainingWeight },
          newData: {
            quantityUsed: dto.quantityUsed,
            greyWeight: dto.greyWeight,
            stockRemaining: stock.remainingWeight - dto.quantityUsed,
          },
          performedBy: 'system',
        },
      });

      return tx.knitterProgram.findUnique({
        where: { id: program.id },
        include: {
          knitter: true,
          yarnLot: true,
          preAssignedDyer: true,
          greyFabricLots: true,
        },
      });
    });
  }

  findAll() {
    return this.prisma.knitterProgram.findMany({
      include: {
        knitter: true,
        yarnLot: true,
        preAssignedDyer: true,
        greyFabricLots: true,
      },
      orderBy: { programDate: 'desc' },
    });
  }

  async remove(id: number) {
    const program = await this.prisma.knitterProgram.findUnique({
      where: { id },
    });

    if (!program) {
      throw new BadRequestException('Knitter program not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert stock
      await tx.knitterStock.updateMany({
        where: {
          knitterId: program.knitterId,
          yarnLotId: program.yarnLotId,
        },
        data: {
          remainingWeight: { increment: program.quantityUsed.toNumber() },
        },
      });

      // Delete greyFabricLots associated with it
      await tx.greyFabricLot.deleteMany({
        where: { knitterProgramId: program.id },
      });

      // Delete the program itself
      return tx.knitterProgram.delete({ where: { id } });
    });
  }
}
