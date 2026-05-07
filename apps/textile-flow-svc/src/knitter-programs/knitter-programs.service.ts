import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnitterProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.knitterProgram.findMany();
  }
}
