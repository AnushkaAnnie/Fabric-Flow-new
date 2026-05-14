import { Module } from '@nestjs/common';
import { YarnInwardService } from './yarn-inward.service';
import { YarnInwardController } from './yarn-inward.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YarnInwardController],
  providers: [YarnInwardService],
  exports: [YarnInwardService],
})
export class YarnInwardModule {}
