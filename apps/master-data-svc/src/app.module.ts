import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MillsModule } from './mills/mills.module';

@Module({
  imports: [PrismaModule, MillsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
