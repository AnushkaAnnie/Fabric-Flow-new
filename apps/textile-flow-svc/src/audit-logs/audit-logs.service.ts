import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 20,
    tableName?: string,
    recordId?: string,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      ...(tableName ? { tableName } : {}),
      ...(recordId ? { recordId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { performedAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
