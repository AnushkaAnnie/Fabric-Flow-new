import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMillDto, UpdateMillDto } from '@fabric-flow/shared';

@Injectable()
export class MillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMillDto) {
    return this.prisma.mill.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.mill.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.mill.count({ where: { isActive: true } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const mill = await this.prisma.mill.findUnique({ where: { id } });
    if (!mill) throw new NotFoundException(`Mill with id ${id} not found`);
    return mill;
  }

  async update(id: string, dto: UpdateMillDto) {
    await this.findOne(id);
    return this.prisma.mill.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mill.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
