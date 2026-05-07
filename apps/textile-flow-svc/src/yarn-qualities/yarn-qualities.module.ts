import { Module } from '@nestjs/common';
import { YarnQualitiesController } from './yarn-qualities.controller';
import { YarnQualitiesService } from './yarn-qualities.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [YarnQualitiesController],
  providers: [YarnQualitiesService],
  exports: [YarnQualitiesService],
})
export class YarnQualitiesModule {}
