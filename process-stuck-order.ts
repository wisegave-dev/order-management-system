import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './src/modules/database/entities/order.entity';
import { Customer } from './src/modules/database/entities/customer.entity';
import { GhlService } from './src/modules/ghl/ghl.service';
import { OrderStatus } from './src/modules/database/entities/order.entity';

async function processStuckOrder() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const orderRepo = app.get<Repository<Order>>(getRepositoryToken(Order));
  const customerRepo = app.get<Repository<Customer>>(getRepositoryToken(Customer));
  const ghlService = app.get<GhlService>(GhlService);

  // Get the stuck order
  const order = await orderRepo.findOne({
    where: { polarCheckoutId: '292b4ced-526a-44d1-89fd-a0ed74e19d34' },
  });

  if (!order) {
    console.log('Order not found');
    await app.close();
    return;
  }

  console.log('\n=== PROCESSING STUCK ORDER ===');
  console.log(`Order ID: ${order.id}`);
  console.log(`Status: ${order.status}`);
  console.log(`Polar Checkout ID: ${order.polarCheckoutId}`);
  console.log(`Subscription ID: ${order.polarSubscriptionId}`);

  // Get customer
  const customer = await customerRepo.findOne({
    where: { id: order.customerId },
  });

  if (!customer) {
    console.log('Customer not found');
    await app.close();
    return;
  }

  console.log(`Customer: ${customer.firstName} ${customer.lastName} (${customer.email})`);
  console.log(`Business: ${customer.businessName || 'N/A'}`);

  // Create GHL account
  console.log('\nCreating GHL account...');

  try {
    const ghlResponse = await ghlService.createAccountFromOrder(
      `${customer.firstName} ${customer.lastName}`.trim(),
      customer.email,
      customer.metadata?.phone || null,
      customer.businessName || null,
    );

    console.log('GHL Response:', ghlResponse);

    // Update order
    order.status = OrderStatus.COMPLETED;
    order.ghlResponse = ghlResponse;
    await orderRepo.save(order);

    console.log('\n✅ Order updated to COMPLETED');

    // Update customer with GHL IDs
    if (ghlResponse.success && ghlResponse.id && ghlResponse.locationId) {
      customer.setGhlAccount(ghlResponse.id, ghlResponse.locationId);
      await customerRepo.save(customer);
      console.log('✅ Customer updated with GHL IDs');
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }

  await app.close();
}

processStuckOrder().catch(console.error);
