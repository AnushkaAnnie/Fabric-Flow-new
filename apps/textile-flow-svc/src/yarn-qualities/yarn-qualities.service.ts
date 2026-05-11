import { Injectable } from '@nestjs/common';
import {
  CreateYarnQualityDto,
  UpdateYarnQualityDto,
} from '@textile-flow/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class YarnQualitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.yarnQuality.findMany();
  }

  create(dto: CreateYarnQualityDto) {
    return this.prisma.yarnQuality.create({ data: dto });
  }

  findOne(id: number) {
    return this.prisma.yarnQuality.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, dto: UpdateYarnQualityDto) {
    return this.prisma.yarnQuality.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.yarnQuality.delete({ where: { id } });
  }
}
