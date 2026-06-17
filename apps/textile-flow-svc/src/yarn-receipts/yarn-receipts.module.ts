import { Module } from '@nestjs/common';
import { YarnReceiptsService } from './yarn-receipts.service';
import { YarnReceiptsController } from './yarn-receipts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YarnReceiptsController],
  providers: [YarnReceiptsService],
  exports: [YarnReceiptsService],
})
export class YarnReceiptsModule {}
