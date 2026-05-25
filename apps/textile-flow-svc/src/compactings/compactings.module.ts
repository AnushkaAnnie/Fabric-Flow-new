import { Module } from '@nestjs/common';
import { CompactingsController } from './compactings.controller';
import { CompactingsService } from './compactings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [PrismaModule, WorkflowModule],
  controllers: [CompactingsController],
  providers: [CompactingsService],
  exports: [CompactingsService],
})
export class CompactingsModule {}
