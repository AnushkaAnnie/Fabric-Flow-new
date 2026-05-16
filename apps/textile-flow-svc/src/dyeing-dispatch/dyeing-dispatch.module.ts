import { Module } from '@nestjs/common';
import { DyeingDispatchService } from './dyeing-dispatch.service';
import { DyeingDispatchController } from './dyeing-dispatch.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DyeingDispatchController],
  providers: [DyeingDispatchService],
  exports: [DyeingDispatchService],
})
export class DyeingDispatchModule {}
