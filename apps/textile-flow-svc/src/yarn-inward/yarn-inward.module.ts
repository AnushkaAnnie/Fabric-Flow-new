import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { YarnInwardController } from './yarn-inward.controller';
import { YarnInwardService } from './yarn-inward.service';

@Module({
  imports: [PrismaModule],
  controllers: [YarnInwardController],
  providers: [YarnInwardService],
  exports: [YarnInwardService],
})
export class YarnInwardModule {}
