import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateKnitterProgramDto } from '@textile-flow/shared';

@Injectable()
export class KnitterProgramsService {
  private readonly logger = new Logger(KnitterProgramsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKnitterProgramDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the knitter's stock for this yarn lot
      const stock = await tx.knitterStock.findUnique({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.knitterId,
            yarnLotId: dto.yarnLotId,
          },
        },
      });
      if (!stock || stock.remainingWeight < dto.quantityUsed) {
        throw new BadRequestException('Insufficient stock at knitter');
      }

      // 2. Deduct from knitter stock
      await tx.knitterStock.update({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.knitterId,
            yarnLotId: dto.yarnLotId,
          },
        },
        data: { remainingWeight: { decrement: dto.quantityUsed } },
      });

      // 3. Anomaly check
      const anomalyFlag = dto.greyWeight > dto.quantityUsed;
      if (anomalyFlag) {
        this.logger.warn(
          `Grey weight (${dto.greyWeight}) exceeds yarn used (${dto.quantityUsed}) for program`,
        );
      }

      // 4. Create KnitterProgram
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
          programDate: dto.programDate ? new Date(dto.programDate) : new Date(),
          anomalyFlag,
        },
      });

      // 5. Create Grey Fabric Lot
      const lotNumber = `GF-${program.id}-${Date.now()}`;
      await tx.greyFabricLot.create({
        data: {
          lotNumber,
          knitterProgramId: program.id,
          knitterId: dto.knitterId,
          greyWeight: dto.greyWeight,
          rollCount: dto.numRolls,
          source: 'KNITTED',
          status: 'AVAILABLE',
        },
      });

      return tx.knitterProgram.findUnique({
        where: { id: program.id },
        include: {
          knitter: true,
          yarnLot: true,
          greyFabricLots: true,
          preAssignedDyer: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.knitterProgram.findMany({
      include: {
        knitter: true,
        yarnLot: true,
        greyFabricLots: true,
        preAssignedDyer: true,
      },
      orderBy: { programDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const program = await this.prisma.knitterProgram.findUnique({
      where: { id },
      include: {
        knitter: true,
        yarnLot: true,
        greyFabricLots: true,
        preAssignedDyer: true,
      },
    });
    if (!program) throw new NotFoundException('Knitter program not found');
    return program;
  }
}
