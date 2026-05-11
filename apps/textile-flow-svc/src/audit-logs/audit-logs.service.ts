import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.auditLog.findMany();
  }

  async create(data: any) {
    return this.prisma.auditLog.create({
      data: {
        tableName: data.tableName || 'unknown',
        recordId: String(data.recordId || 0),
        action: data.action || 'CREATE',
        oldData: data.oldData || null,
        newData: data.newData || null,
        performedBy: data.performedBy || 'system',
      },
    });
  }
}
