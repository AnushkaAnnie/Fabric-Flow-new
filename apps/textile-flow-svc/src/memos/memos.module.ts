import { Module } from '@nestjs/common';
import { MemosService } from './memos.service';
import { MemosController } from './memos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MemosController],
  providers: [MemosService],
  exports: [MemosService],
})
export class MemosModule {}
