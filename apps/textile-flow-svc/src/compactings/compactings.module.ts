import { Module } from '@nestjs/common';
import { CompactingsController } from './compactings.controller';
import { CompactingsService } from './compactings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompactingsController],
  providers: [CompactingsService],
  exports: [CompactingsService],
})
export class CompactingsModule {}
