import { Module } from '@nestjs/common';
import { WashTypesController } from './wash-types.controller';
import { WashTypesService } from './wash-types.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WashTypesController],
  providers: [WashTypesService],
  exports: [WashTypesService],
})
export class WashTypesModule {}
