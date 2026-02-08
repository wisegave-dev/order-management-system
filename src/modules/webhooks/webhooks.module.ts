import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { Webhook } from '../database/entities/webhook.entity';
import { Order } from '../database/entities/order.entity';
import { Customer } from '../database/entities/customer.entity';
import { GhlModule } from '../ghl/ghl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, Order, Customer]),
    GhlModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
