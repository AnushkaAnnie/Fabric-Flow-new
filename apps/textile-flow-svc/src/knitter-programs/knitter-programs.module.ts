import { Module } from '@nestjs/common';
import { KnitterProgramsService } from './knitter-programs.service';
import { KnitterProgramsController } from './knitter-programs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KnitterProgramsController],
  providers: [KnitterProgramsService],
  exports: [KnitterProgramsService],
})
export class KnitterProgramsModule {}
