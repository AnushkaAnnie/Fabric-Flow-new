import { Module } from '@nestjs/common';
import { DyeingsController } from './dyeings.controller';
import { DyeingsService } from './dyeings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, WorkflowModule, InventoryModule],
  controllers: [DyeingsController],
  providers: [DyeingsService],
  exports: [DyeingsService],
})
export class DyeingsModule {}
