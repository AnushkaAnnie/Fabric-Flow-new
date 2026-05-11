import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get mill() {
    return this.prisma.mill;
  }

  get knitter() {
    return this.prisma.knitter;
  }

  get dyer() {
    return this.prisma.dyer;
  }

  get compacter() {
    return this.prisma.compacter;
  }

  get colour() {
    return this.prisma.colour;
  }

  get washType() {
    return this.prisma.washType;
  }

  get yarnQuality() {
    return this.prisma.yarnQuality;
  }

  get yarnLot() {
    return this.prisma.yarnLot;
  }

  get knitterStock() {
    return this.prisma.knitterStock;
  }

  get deliveryNote() {
    return this.prisma.deliveryNote;
  }

  get knitterProgram() {
    return this.prisma.knitterProgram;
  }

  get greyFabricLot() {
    return this.prisma.greyFabricLot;
  }

  get dyeingProgram() {
    return this.prisma.dyeingProgram;
  }

  get auditLog() {
    return this.prisma.auditLog;
  }
}