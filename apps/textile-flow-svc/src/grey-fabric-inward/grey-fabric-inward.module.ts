import { Module } from '@nestjs/common';
import { GreyFabricInwardService } from './grey-fabric-inward.service';
import { GreyFabricInwardController } from './grey-fabric-inward.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GreyFabricInwardController],
  providers: [GreyFabricInwardService],
  exports: [GreyFabricInwardService],
})
export class GreyFabricInwardModule {}
