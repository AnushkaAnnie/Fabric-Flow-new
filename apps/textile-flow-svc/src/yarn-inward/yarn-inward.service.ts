import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateYarnInwardDto, UpdateYarnInwardDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { yarnStatusFromInvoice } from '../common/adapters/workflow-status.adapter';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class YarnInwardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  create(dto: CreateYarnInwardDto) {
    return this.prisma.$transaction(async (tx) => {
      const bags = dto.numBags ?? 0;
      const bagWeight = dto.bagWeight ?? 60;
      const totalWeight = bags * bagWeight;
      if (totalWeight <= 0) {
        throw new BadRequestException(
          'Total yarn weight must be greater than zero',
        );
      }

      const rate = dto.ratePerKg ?? 0;
      const taxable = totalWeight * rate;
      const cgstRate = dto.cgstRate ?? 2.5;
      const sgstRate = dto.sgstRate ?? 2.5;
      const cgstAmount = taxable * (cgstRate / 100);
      const sgstAmount = taxable * (sgstRate / 100);
      const totalCost = taxable + cgstAmount + sgstAmount;

      const inward = await tx.yarnInward.create({
        data: {
          receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
          millId: dto.millId,
          deliveryKnitterId: dto.deliveryKnitterId,
          hfBatch: dto.hfBatch,
          yarnCount: dto.yarnCount,
          yarnQuality: dto.yarnQuality,
          rlVl: dto.rlVl,
          numBags: bags,
          bagWeight,
          totalWeight,
          ratePerKg: rate,
          cgstRate,
          sgstRate,
          cgstAmount,
          sgstAmount,
          totalCost,
          purchaseAccount: dto.purchaseAccount,
          remarks: dto.remarks,
        },
      });

      const yarnLot = await tx.yarnLot.create({
        data: {
          hfCode: dto.hfBatch ?? `YI-${inward.id}`,
          yarnInwardId: inward.id,
          millId: dto.millId,
          deliveryTo: String(dto.deliveryKnitterId),
          description: dto.yarnQuality,
          count: dto.yarnCount,
          quality: dto.yarnQuality,
          status: yarnStatusFromInvoice(dto.hfBatch),
          ratePerKg: rate,
          totalWeight,
          totalCost,
          availableWeight: 0,
          noOfBags: bags,
          bagWeight,
          cgstRate,
          sgstRate,
          cgstAmount,
          sgstAmount,
        },
      });

      await tx.knitterStock.upsert({
        where: {
          knitterId_yarnLotId: {
            knitterId: dto.deliveryKnitterId,
            yarnLotId: yarnLot.id,
          },
        },
        create: {
          knitterId: dto.deliveryKnitterId,
          yarnLotId: yarnLot.id,
          receivedWeight: totalWeight,
          remainingWeight: totalWeight,
        },
        update: {
          receivedWeight: { increment: totalWeight },
          remainingWeight: { increment: totalWeight },
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: 'yarn_inwards',
          recordId: String(inward.id),
          action: 'CREATE',
          oldData: undefined,
          newData: { yarnLotId: yarnLot.id, totalWeight },
          performedBy: 'system',
        },
      });

      await this.inventoryService.postInventoryMovement(
        {
          entityType: 'YarnPurchase',
          entityId: inward.id,
          itemType: 'YARN',
          inwardWeight: totalWeight,
          referenceNo: inward.hfBatch ?? undefined,
          remarks: 'Yarn Purchase',
        },
        tx,
      );

      return tx.yarnInward.findUnique({
        where: { id: inward.id },
        include: {
          mill: true,
          deliveryKnitter: true,
          yarnLots: true,
        },
      });
    });
  }

  findAll() {
    return this.prisma.yarnInward.findMany({
      include: { mill: true, deliveryKnitter: true, yarnLots: true },
      orderBy: { receiptDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const inward = await this.prisma.yarnInward.findUnique({
      where: { id },
      include: { mill: true, deliveryKnitter: true, yarnLots: true },
    });
    if (!inward) throw new NotFoundException('Yarn inward not found');
    return inward;
  }

  async update(id: number, dto: UpdateYarnInwardDto) {
    await this.findOne(id);
    return this.prisma.yarnInward.update({
      where: { id },
      data: {
        receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : undefined,
        millId: dto.millId,
        deliveryKnitterId: dto.deliveryKnitterId,
        hfBatch: dto.hfBatch,
        yarnCount: dto.yarnCount,
        yarnQuality: dto.yarnQuality,
        rlVl: dto.rlVl,
        numBags: dto.numBags,
        bagWeight: dto.bagWeight,
        ratePerKg: dto.ratePerKg,
        cgstRate: dto.cgstRate,
        sgstRate: dto.sgstRate,
        purchaseAccount: dto.purchaseAccount,
        remarks: dto.remarks,
      },
      include: { mill: true, deliveryKnitter: true, yarnLots: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.yarnInward.delete({ where: { id } });
  }
}
