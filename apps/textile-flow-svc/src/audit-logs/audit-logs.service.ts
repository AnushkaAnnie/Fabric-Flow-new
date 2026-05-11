import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Action, Prisma } from '../../generated/prisma';

export interface CreateAuditLogDto {
  tableName: string;
  recordId: number | string;
  action: Action;
  oldData?: unknown;
  newData?: unknown;
  performedBy?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.auditLog.findMany();
  }

  async create(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        tableName: data.tableName || 'unknown',
        recordId: String(data.recordId || 0),
        action: data.action,
        oldData: (data.oldData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newData: (data.newData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        performedBy: data.performedBy || 'system',
      },
    });
  }
}
