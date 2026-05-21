import { Module } from '@nestjs/common';
import { DyeingsController } from './dyeings.controller';
import { DyeingsService } from './dyeings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DyeingsController],
  providers: [DyeingsService],
  exports: [DyeingsService],
})
export class DyeingsModule {}
