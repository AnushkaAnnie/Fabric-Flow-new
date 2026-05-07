import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnittersModule } from './knitters/knitters.module';
import { DyersModule } from './dyers/dyers.module';
import { CompactersModule } from './compacters/compacters.module';
import { ColoursModule } from './colours/colours.module';
import { WashTypesModule } from './wash-types/wash-types.module';
import { YarnQualitiesModule } from './yarn-qualities/yarn-qualities.module';
import { YarnLotsModule } from './yarn-lots/yarn-lots.module';
import { KnitterStockModule } from './knitter-stock/knitter-stock.module';
import { DeliveryNotesModule } from './delivery-notes/delivery-notes.module';
import { KnitterProgramsModule } from './knitter-programs/knitter-programs.module';
import { GreyFabricLotsModule } from './grey-fabric-lots/grey-fabric-lots.module';
import { DyeingProgramsModule } from './dyeing-programs/dyeing-programs.module';
import { MillsModule } from './mills/mills.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    KnittersModule,
    DyersModule,
    CompactersModule,
    ColoursModule,
    WashTypesModule,
    YarnQualitiesModule,
    YarnLotsModule,
    KnitterStockModule,
    DeliveryNotesModule,
    KnitterProgramsModule,
    GreyFabricLotsModule,
    DyeingProgramsModule,
    MillsModule,
    PrismaModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
