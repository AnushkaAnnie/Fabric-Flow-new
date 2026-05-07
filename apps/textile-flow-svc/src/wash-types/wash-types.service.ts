import { Injectable } from '@nestjs/common';
import { CreateWashTypeDto, UpdateWashTypeDto } from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WashTypesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.washType.findMany();
  }

  create(dto: CreateWashTypeDto) {
    return this.prisma.washType.create({ data: dto });
  }

  findOne(id: string) {
    return this.prisma.washType.findUniqueOrThrow({ where: { id } });
  }

  update(id: string, dto: UpdateWashTypeDto) {
    return this.prisma.washType.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.washType.delete({ where: { id } });
  }
}
