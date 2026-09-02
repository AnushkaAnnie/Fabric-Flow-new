import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGreyFabricInwardDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class GreyFabricInwardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly activityLogger: ActivityLogsService,
  ) {}

  create(dto: CreateGreyFabricInwardDto, performingUser = 'system') {
    const totalCost =
      dto.totalWeight && dto.ratePerKg
        ? dto.totalWeight * dto.ratePerKg
        : undefined;

    return this.prisma
      .$transaction(async (tx) => {
        // 1. Create the GreyFabricInward record
        const inward = await tx.greyFabricInward.create({
          data: {
            receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
            supplierName: dto.supplierName,
            fbNo: dto.fbNo,
            fabricType: dto.fabricType,
            colour: dto.colour,
            totalWeight: dto.totalWeight,
            rollCount: dto.rollCount,
            ratePerKg: dto.ratePerKg,
            totalCost,
            purchaseAccount: dto.purchaseAccount,
            remarks: dto.remarks,
          },
        });

        // 2. Create the linked GreyFabricLot (PURCHASED source).
        // Hard requirement — failure rolls back the entire inward record.
        await tx.greyFabricLot.create({
          data: {
            lotNumber: `GFLP-${inward.id}`,
            greyWeight: dto.totalWeight,
            rollCount: dto.rollCount ?? null,
            source: 'PURCHASED',
            status: 'AVAILABLE',
            greyFabricInwardId: inward.id,
            // knitterId is intentionally null — purchased fabric has no associated knitter
          },
        });

        // 3. Post InventoryLedger inward entry for this grey fabric purchase
        await this.inventoryService.postInventoryMovement(
          {
            entityType: 'GreyFabricPurchase',
            entityId: inward.id,
            itemType: 'GREY',
            inwardWeight: Number(dto.totalWeight),
            referenceNo: dto.fbNo ?? String(inward.id),
            stage: 'GREY_FABRIC_INWARD',
            remarks: `Grey fabric purchased from ${dto.supplierName}`,
          },
          tx,
        );

        // 4. Return the inward record with its created lot
        return tx.greyFabricInward.findUnique({
          where: { id: inward.id },
          include: { greyFabricLots: true },
        });
      })
      .then((result) => {
        // 5. Fire-and-forget activity log (outside transaction — non-blocking)
        void this.activityLogger.log({
          user: performingUser,
          action: 'Grey Fabric Inward Created',
          module: 'Grey Fabric Inward',
          details: `Supplier: ${dto.supplierName} | Weight: ${dto.totalWeight} kg | Lot: GFLP-${result?.id ?? '?'}`,
        });
        return result;
      });
  }

  findAll() {
    return this.prisma.greyFabricInward.findMany({
      orderBy: { receiptDate: 'desc' },
      include: { greyFabricLots: true },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.greyFabricInward.findUnique({
      where: { id },
      include: { greyFabricLots: true },
    });
    if (!record)
      throw new NotFoundException('Grey fabric inward record not found');
    return record;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.greyFabricInward.delete({ where: { id } });
  }
}

