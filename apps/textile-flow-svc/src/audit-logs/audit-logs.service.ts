import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogDto {
  tableName: string;
  recordId: number | string;
  action: string; // 'CREATE' | 'UPDATE' | 'DELETE'
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  performedBy?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { performedAt: 'desc' },
      take: 500,
    });
  }

  async create(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        tableName: data.tableName,
        recordId: String(data.recordId || 0),
        action: data.action as any,
        oldData: data.oldData ? JSON.parse(JSON.stringify(data.oldData)) : null,
        newData: data.newData ? JSON.parse(JSON.stringify(data.newData)) : null,
        performedBy: data.performedBy || 'system',
      },
    });
  }
}
