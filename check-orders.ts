import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './src/modules/database/entities/order.entity';
import { Webhook, WebhookStatus } from './src/modules/database/entities/webhook.entity';

async function checkOrders() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const orderRepo = app.get<Repository<Order>>(getRepositoryToken(Order));
  const webhookRepo = app.get<Repository<Webhook>>(getRepositoryToken(Webhook));

  console.log('\n=== RECENT ORDERS ===');
  const orders = await orderRepo.find({
    order: { createdAt: 'DESC' },
    take: 5,
  });

  for (const order of orders) {
    console.log(`\nOrder ID: ${order.id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Polar Checkout ID: ${order.polarCheckoutId}`);
    console.log(`Subscription ID: ${order.polarSubscriptionId}`);
    console.log(`Amount: ${order.amount} ${order.currency}`);
    console.log(`Created: ${order.createdAt}`);
    console.log(`GHL Response:`, order.ghlResponse);
  }

  console.log('\n=== RECENT WEBHOOKS ===');
  const webhooks = await webhookRepo.find({
    order: { createdAt: 'DESC' },
    take: 10,
  });

  for (const webhook of webhooks) {
    console.log(`\nEvent ID: ${webhook.eventId}`);
    console.log(`Type: ${webhook.eventType}`);
    console.log(`Status: ${webhook.status}`);
    console.log(`Created: ${webhook.createdAt}`);
    if (webhook.status === WebhookStatus.FAILED) {
      console.log(`Error: ${webhook.errorMessage}`);
    }
  }

  await app.close();
}

checkOrders().catch(console.error);
