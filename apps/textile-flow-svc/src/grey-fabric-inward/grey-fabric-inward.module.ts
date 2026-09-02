import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GreyFabricInwardController } from './grey-fabric-inward.controller';
import { GreyFabricInwardService } from './grey-fabric-inward.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [PrismaModule, InventoryModule, ActivityLogsModule],
  controllers: [GreyFabricInwardController],
  providers: [GreyFabricInwardService],
  exports: [GreyFabricInwardService],
})
export class GreyFabricInwardModule {}
