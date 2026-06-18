import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, PurchaseOrderItemDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseOrderDto) {
    const {
      items,
      date,
      deliveryDate,
      poType,
      deliveryName,
      deliveryAddress,
      deliveryGST,
      fabricType,
      fabricColour,
      fabricDia,
      fabricGsm,
      totalFabricWeight,
      millId,
      knitterId,
      ...rest
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          ...rest,
          date: new Date(date),
          deliveryDate: new Date(deliveryDate),
          poType: poType || 'YARN',
          deliveryName,
          deliveryAddress,
          deliveryGST,
          fabricType,
          fabricColour,
          fabricDia,
          fabricGsm,
          totalFabricWeight,
          items: {
            create: items.map((item) => ({
              description: item.description,
              count: item.count,
              quality: item.quality,
              bags: item.bags,
              bagWeight: item.bagWeight,
              totalWeight: item.totalWeight,
              rate: item.rate,
              cgst: item.cgst,
              sgst: item.sgst,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // ── Auto-create YarnInward from PO ───────────────────────────────────
      let inwardLinkWarning: string | null = null;

      if (!dto.poType || dto.poType === 'YARN') {
        const firstItem = items[0];

        // Resolve Mill: prefer explicit millId, fall back to name matching
        const mill = dto.millId
          ? await tx.mill.findUnique({ where: { id: dto.millId } })
          : await tx.mill.findFirst({
              where: { name: { contains: rest.supplierName ?? '', mode: 'insensitive' } },
            });

        // Resolve Knitter: prefer explicit knitterId, fall back to name matching
        const knitter = dto.knitterId
          ? await tx.knitter.findUnique({ where: { id: dto.knitterId } })
          : dto.deliveryName
          ? await tx.knitter.findFirst({
              where: { name: { contains: dto.deliveryName, mode: 'insensitive' } },
            })
          : null;

        if (mill && knitter && firstItem) {
          const bags = firstItem.bags ?? 0;
          const bagWeight = firstItem.bagWeight ?? 60;
          const totalWeight = bags * bagWeight;
          const rate = firstItem.rate ?? 0;
          const cgst = firstItem.cgst ?? 2.5;
          const sgst = firstItem.sgst ?? 2.5;
          const taxable = totalWeight * rate;
          const cgstAmt = taxable * (cgst / 100);
          const sgstAmt = taxable * (sgst / 100);

          await tx.yarnInward.create({
            data: {
              status:             'PENDING',
              purchaseOrderId:    po.id,
              receiptDate:        new Date(dto.deliveryDate),
              millId:             mill.id,
              deliveryKnitterId:  knitter.id,
              hfBatch:            po.hfCode,
              yarnCount:          firstItem.count ?? null,
              yarnQuality:        firstItem.quality ?? null,
              numBags:            bags,
              bagWeight:          bagWeight,
              totalWeight:        totalWeight,
              ratePerKg:          rate,
              cgstRate:           cgst,
              sgstRate:           sgst,
              cgstAmount:         cgstAmt,
              sgstAmount:         sgstAmt,
              totalCost:          taxable + cgstAmt + sgstAmt,
              purchaseAccount:    'C.N.T.LLP',
              receivedWeight:     null,
              millInvoiceNo:      null,
              millDcNo:           null,
            },
          });
        } else {
          // Non-fatal: surface a warning so the frontend can show a yellow toast,
          // but never throw — the PO itself must always be saved.
          const missingParts: string[] = [];
          if (!mill) missingParts.push(`mill not found for "${rest.supplierName}" (try passing millId)`);
          if (!knitter) missingParts.push(`knitter not found for "${dto.deliveryName ?? 'no delivery name'}" (try passing knitterId)`);
          if (!firstItem) missingParts.push('no items in PO');
          inwardLinkWarning = `YarnInward auto-link skipped: ${missingParts.join('; ')}`;
          console.warn('[PurchaseOrdersService] create() —', inwardLinkWarning);
        }
      }

      // Attach warning to the response so the frontend can surface it
      return { ...po, inwardLinkWarning };
    });
  }

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) {
      throw new NotFoundException(`Purchase Order with id "${id}" not found`);
    }
    return po;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    // Verify record exists first
    await this.findOne(id);

    const {
      items,
      date,
      deliveryDate,
      poType,
      deliveryName,
      deliveryAddress,
      deliveryGST,
      fabricType,
      fabricColour,
      fabricDia,
      fabricGsm,
      totalFabricWeight,
      ...rest
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Replace items wholesale when provided
      if (items !== undefined) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });
      }

      const po = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...rest,
          ...(date !== undefined && { date: new Date(date) }),
          ...(deliveryDate !== undefined && { deliveryDate: new Date(deliveryDate) }),
          ...(poType !== undefined && { poType }),
          ...(deliveryName !== undefined && { deliveryName }),
          ...(deliveryAddress !== undefined && { deliveryAddress }),
          ...(deliveryGST !== undefined && { deliveryGST }),
          ...(fabricType !== undefined && { fabricType }),
          ...(fabricColour !== undefined && { fabricColour }),
          ...(fabricDia !== undefined && { fabricDia }),
          ...(fabricGsm !== undefined && { fabricGsm }),
          ...(totalFabricWeight !== undefined && { totalFabricWeight }),
          ...(items !== undefined && {
            items: {
              create: items.map((item: PurchaseOrderItemDto) => ({
                description: item.description,
                count: item.count,
                quality: item.quality,
                bags: item.bags,
                bagWeight: item.bagWeight,
                totalWeight: item.totalWeight,
                rate: item.rate,
                cgst: item.cgst,
                sgst: item.sgst,
              })),
            },
          }),
        },
        include: {
          items: true,
        },
      });

      return po;
    });
  }

  async remove(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new NotFoundException('Purchase Order not found');
    }
    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }
}
