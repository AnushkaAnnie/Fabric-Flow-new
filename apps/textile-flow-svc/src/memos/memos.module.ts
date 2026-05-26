import { Module } from '@nestjs/common';
import { MemosService } from './memos.service';
import { MemosController } from './memos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, WorkflowModule, InventoryModule],
  controllers: [MemosController],
  providers: [MemosService],
  exports: [MemosService],
})
export class MemosModule {}
