import { Module } from '@nestjs/common';
import { KnitterProgramsController } from './knitter-programs.controller';
import { KnitterProgramsService } from './knitter-programs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KnitterProgramsController],
  providers: [KnitterProgramsService],
  exports: [KnitterProgramsService],
})
export class KnitterProgramsModule {}
