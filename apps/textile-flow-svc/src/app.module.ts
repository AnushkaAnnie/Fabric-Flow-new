import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KnittersModule } from './knitters/knitters.module';
import { DyersModule } from './dyers/dyers.module';
import { CompactersModule } from './compacters/compacters.module';
import { ColoursModule } from './colours/colours.module';
import { WashTypesModule } from './wash-types/wash-types.module';
import { YarnLotsModule } from './yarn-lots/yarn-lots.module';
import { KnitterStockModule } from './knitter-stock/knitter-stock.module';
import { DeliveryNotesModule } from './delivery-notes/delivery-notes.module';
import { GreyFabricLotsModule } from './grey-fabric-lots/grey-fabric-lots.module';
import { DyeingProgramsModule } from './dyeing-programs/dyeing-programs.module';
import { MillsModule } from './mills/mills.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { DevAuthGuard } from './common/guards/dev-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

import { MemosModule } from './memos/memos.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { YarnReceiptsModule } from './yarn-receipts/yarn-receipts.module';
import { KnittingsModule } from './knittings/knittings.module';
import { KnittingLotsModule } from './knitting-lots/knitting-lots.module';
import { DyeingsModule } from './dyeings/dyeings.module';
import { DyeingOrdersModule } from './dyeing-orders/dyeing-orders.module';
import { CompactingsModule } from './compactings/compactings.module';
import { InhouseKnittedFabricsModule } from './inhouse-knitted-fabrics/inhouse-knitted-fabrics.module';

@Module({
  imports: [
    KnittersModule,
    DyersModule,
    CompactersModule,
    ColoursModule,
    WashTypesModule,
    YarnLotsModule,
    KnitterStockModule,
    DeliveryNotesModule,
    GreyFabricLotsModule,
    DyeingProgramsModule,
    MillsModule,
    PrismaModule,
    AuditLogsModule,
    MemosModule,
    PurchaseOrdersModule,
    YarnReceiptsModule,
    KnittingsModule,
    KnittingLotsModule,
    DyeingsModule,
    DyeingOrdersModule,
    CompactingsModule,
    InhouseKnittedFabricsModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: DevAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
