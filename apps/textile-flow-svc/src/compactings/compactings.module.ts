import { Module } from '@nestjs/common';
import { CompactingsController } from './compactings.controller';
import { CompactingsService } from './compactings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, WorkflowModule, InventoryModule],
  controllers: [CompactingsController],
  providers: [CompactingsService],
  exports: [CompactingsService],
})
export class CompactingsModule {}
