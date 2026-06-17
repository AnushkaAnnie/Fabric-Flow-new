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

    return this.prisma.purchaseOrder.create({
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
