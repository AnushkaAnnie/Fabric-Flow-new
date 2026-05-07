import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { performedAt: 'desc' },
    });
  }

  async create(dto: {
    tableName: string;
    recordId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    performedBy: string;
  }) {
    const data: Prisma.AuditLogCreateInput = {
      tableName: dto.tableName,
      recordId: dto.recordId,
      action: dto.action,
      oldData: dto.oldData as Prisma.InputJsonValue | undefined,
      newData: dto.newData as Prisma.InputJsonValue | undefined,
      performedBy: dto.performedBy,
    };

    return this.prisma.auditLog.create({
      data,
    });
  }
}
