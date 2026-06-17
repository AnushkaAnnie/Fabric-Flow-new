import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

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

      // Auto-create YarnInward from PO
      if (dto.poType === 'YARN' || !dto.poType) {
        const firstItem = items[0];

        // Resolve millId: find Mill by name matching supplierName
        const mill = await tx.mill.findFirst({
          where: { name: { contains: rest.supplierName, mode: 'insensitive' } },
        });

        // Resolve knitterId: find Knitter by name matching deliveryName
        const knitter = dto.deliveryName
          ? await tx.knitter.findFirst({
              where: {
                name: { contains: dto.deliveryName, mode: 'insensitive' },
              },
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
              // These stay null until yarn physically arrives:
              receivedWeight:     null,
              millInvoiceNo:      null,
              millDcNo:           null,
            },
          });
        }
      }

      return po;
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

  async remove(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new Error('Purchase Order not found');
    }
    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }
}
