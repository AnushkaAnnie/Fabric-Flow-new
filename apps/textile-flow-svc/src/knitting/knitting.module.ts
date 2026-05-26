import { Module } from '@nestjs/common';
import { KnittingService } from './knitting.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, WorkflowModule, InventoryModule],
  providers: [KnittingService],
  exports: [KnittingService],
})
export class KnittingModule {}
