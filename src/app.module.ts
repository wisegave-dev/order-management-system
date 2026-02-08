import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ConfigModule as AppConfigModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { GhlModule } from './modules/ghl/ghl.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AppConfigModule,
    DatabaseModule,
    CustomersModule,
    OrdersModule,
    WebhooksModule,
    GhlModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
