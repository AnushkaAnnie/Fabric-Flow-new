import { Module } from '@nestjs/common';
import { LotTrackerService } from './lot-tracker.service';
import { LotTrackerController } from './lot-tracker.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LotTrackerController],
  providers: [LotTrackerService],
  exports: [LotTrackerService],
})
export class LotTrackerModule {}
