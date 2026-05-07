import { Injectable } from '@nestjs/common';
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
    return this.prisma.auditLog.create({
      data: {
        tableName: dto.tableName,
        recordId: dto.recordId,
        action: dto.action,
        oldData: dto.oldData ?? undefined,
        newData: dto.newData ?? undefined,
        performedBy: dto.performedBy,
      } as any,
    });
  }
}
