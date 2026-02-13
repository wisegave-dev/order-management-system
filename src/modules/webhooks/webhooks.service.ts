import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookStatus, PolarWebhookEventType } from '../database/entities/webhook.entity';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { Customer } from '../database/entities/customer.entity';
import { WebhookEventDto, PolarCustomer, PolarSubscription, PolarOrder, PolarRefund } from './dto/webhook-event.dto';
import { GhlService } from '../ghl/ghl.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private ghlService: GhlService,
  ) {}

  /**
   * Process incoming webhook from Polar
   */
  async processWebhook(eventDto: WebhookEventDto, signature?: string): Promise<Webhook> {
    // Check if webhook already exists (idempotency)
    const existingWebhook = await this.webhookRepository.findOne({
      where: { eventId: eventDto.id },
    });

    if (existingWebhook) {
      this.logger.log(`Webhook ${eventDto.id} already processed, skipping`);
      return existingWebhook;
    }

    // Create webhook log
    const webhook = this.webhookRepository.create({
      eventId: eventDto.id,
      eventType: eventDto.type as PolarWebhookEventType,
      status: WebhookStatus.PENDING,
      payload: eventDto,
      signature,
    });

    await this.webhookRepository.save(webhook);
    this.logger.log(`Webhook received: ${eventDto.type} (${eventDto.id})`);

    // Process the webhook
    try {
      const result = await this.processWebhookEvent(eventDto);

      // Update webhook as processed
      webhook.status = WebhookStatus.PROCESSED;
      webhook.processedData = result;
      webhook.processedAt = new Date();
      await this.webhookRepository.save(webhook);

      this.logger.log(`Webhook processed successfully: ${eventDto.id}`);
      return webhook;
    } catch (error) {
      this.logger.error(`Error processing webhook ${eventDto.id}: ${error.message}`, error.stack);

      webhook.status = WebhookStatus.FAILED;
      webhook.errorMessage = error.message;
      await this.webhookRepository.save(webhook);

      throw error;
    }
  }

  /**
   * Route webhook events to appropriate handlers
   */
  private async processWebhookEvent(eventDto: WebhookEventDto): Promise<any> {
    const { type, data } = eventDto;

    switch (type) {
      // Customer events
      case PolarWebhookEventType.CUSTOMER_CREATED:
        return this.handleCustomerCreated(data);
      case PolarWebhookEventType.CUSTOMER_UPDATED:
        return this.handleCustomerUpdated(data);
      case PolarWebhookEventType.CUSTOMER_DELETED:
        return this.handleCustomerDeleted(data);
      case PolarWebhookEventType.CUSTOMER_STATE_CHANGED:
        return this.handleCustomerStateChanged(data);

      // Subscription events
      case PolarWebhookEventType.SUBSCRIPTION_CREATED:
        return this.handleSubscriptionCreated(data);
      case PolarWebhookEventType.SUBSCRIPTION_UPDATED:
        return this.handleSubscriptionUpdated(data);
      case PolarWebhookEventType.SUBSCRIPTION_ACTIVE:
        return this.handleSubscriptionActive(data);
      case PolarWebhookEventType.SUBSCRIPTION_CANCELED:
        return this.handleSubscriptionCanceled(data);
      case PolarWebhookEventType.SUBSCRIPTION_UNCANCELED:
        return this.handleSubscriptionUncanceled(data);
      case PolarWebhookEventType.SUBSCRIPTION_REVOKED:
        return this.handleSubscriptionRevoked(data);
      case PolarWebhookEventType.SUBSCRIPTION_PAST_DUE:
        return this.handleSubscriptionPastDue(data);

      // Order events
      case PolarWebhookEventType.ORDER_CREATED:
        return this.handleOrderCreated(data);
      case PolarWebhookEventType.ORDER_UPDATED:
        return this.handleOrderUpdated(data);
      case PolarWebhookEventType.ORDER_PAID:
        return this.handleOrderPaid(data);
      case PolarWebhookEventType.ORDER_REFUNDED:
        return this.handleOrderRefunded(data);

      // Refund events
      case PolarWebhookEventType.REFUND_CREATED:
        return this.handleRefundCreated(data);
      case PolarWebhookEventType.REFUND_UPDATED:
        return this.handleRefundUpdated(data);

      // Product events
      case PolarWebhookEventType.PRODUCT_CREATED:
      case PolarWebhookEventType.PRODUCT_UPDATED:
        return this.handleProductEvent(data);

      // Benefit events
      case PolarWebhookEventType.BENEFIT_CREATED:
      case PolarWebhookEventType.BENEFIT_UPDATED:
        return this.handleBenefitEvent(data);

      // Benefit Grant events
      case PolarWebhookEventType.BENEFIT_GRANT_CREATED:
        return this.handleBenefitGrantCreated(data);
      case PolarWebhookEventType.BENEFIT_GRANT_CYCLED:
        return this.handleBenefitGrantCycled(data);
      case PolarWebhookEventType.BENEFIT_GRANT_UPDATED:
        return this.handleBenefitGrantUpdated(data);
      case PolarWebhookEventType.BENEFIT_GRANT_REVOKED:
        return this.handleBenefitGrantRevoked(data);

      // Organization events
      case PolarWebhookEventType.ORGANIZATION_UPDATED:
        return this.handleOrganizationUpdated(data);

      // Checkout events
      case PolarWebhookEventType.CHECKOUT_CREATED:
      case PolarWebhookEventType.CHECKOUT_UPDATED:
        return this.handleCheckoutEvent(data);

      default:
        this.logger.warn(`Unhandled webhook event type: ${type}`);
        return { message: 'Event received but not processed' };
    }
  }

  // ==================== CUSTOMER HANDLERS ====================

  private async handleCustomerCreated(data: any): Promise<any> {
    this.logger.log(`Customer created: ${data.id} (${data.email})`);

    // Check if customer already exists by email
    let customer = await this.customerRepository.findOne({
      where: { email: data.email },
    });

    if (!customer) {
      // Extract name from custom_field_data if available (Polar checkout custom fields)
      const firstName = data.custom_field_data?.first_name || data.name?.split(' ')[0] || '';
      const lastName = data.custom_field_data?.last_name || data.name?.split(' ').slice(1).join(' ') || '';
      const phone = data.custom_field_data?.phone || null;

      // Create new customer
      customer = this.customerRepository.create({
        firstName,
        lastName,
        email: data.email,
        businessName: data.billing_address?.organization || '',
        metadata: {
          polar_customer_id: data.id,
          phone,
        },
      });
      await this.customerRepository.save(customer);
      this.logger.log(`New customer created: ${customer.id}`);
    } else {
      // Update existing customer with Polar ID
      this.logger.log(`Customer already exists: ${customer.id}`);
    }

    return { customerId: customer.id, polarCustomerId: data.id };
  }

  private async handleCustomerUpdated(data: any): Promise<any> {
    this.logger.log(`Customer updated: ${data.id}`);

    const customer = await this.customerRepository.findOne({
      where: { email: data.email },
    });

    if (customer) {
      customer.firstName = data.name?.split(' ')[0] || customer.firstName;
      customer.lastName = data.name?.split(' ').slice(1).join(' ') || data.name || customer.lastName;
      customer.businessName = data.billing_address?.organization || customer.businessName;
      await this.customerRepository.save(customer);
    }

    return { customerId: customer?.id, polarCustomerId: data.id };
  }

  private async handleCustomerDeleted(data: any): Promise<any> {
    this.logger.log(`Customer deleted: ${data.id}`);
    // Soft delete customer if needed
    return { polarCustomerId: data.id, action: 'deleted' };
  }

  private async handleCustomerStateChanged(data: any): Promise<any> {
    this.logger.log(`Customer state changed: ${data.id}`);
    return { polarCustomerId: data.id, state: data.state };
  }

  // ==================== SUBSCRIPTION HANDLERS ====================

  private async handleSubscriptionCreated(data: any): Promise<any> {
    this.logger.log(`Subscription created: ${data.id}`);

    // Don't create orders here - orders are created by order.created webhook
    // Just store subscription metadata for reference
    return {
      subscriptionId: data.id,
      message: 'Subscription recorded, order will be created by order.created webhook',
    };
  }

  private async handleSubscriptionUpdated(data: any): Promise<any> {
    this.logger.log(`Subscription updated: ${data.id}`);
    return { subscriptionId: data.id, updated: true };
  }

  private async handleSubscriptionActive(data: any): Promise<any> {
    this.logger.log(`Subscription active: ${data.id}`);
    return { subscriptionId: data.id, status: 'active' };
  }

  private async handleSubscriptionCanceled(data: any): Promise<any> {
    this.logger.log(`Subscription canceled: ${data.id}`);

    const subscriptionId = data.id;
    let ghlAccountId: string | null = null;
    let ghlLocationId: string | null = null;
    let orderId: string | null = null;
    let customerId: string | null = null;

    try {
      // Find all orders associated with this subscription
      const orders = await this.orderRepository.find({
        where: { polarSubscriptionId: subscriptionId },
      });

      if (orders.length === 0) {
        this.logger.warn(`No orders found for subscription: ${subscriptionId}`);
        return { subscriptionId, status: 'canceled', message: 'No orders found' };
      }

      this.logger.log(`Found ${orders.length} order(s) for subscription: ${subscriptionId}`);

      // Get the customer to check for GHL IDs in metadata
      const customer = await this.customerRepository.findOne({
        where: { id: orders[0].customerId },
      });

      // Process each order (typically there should be only one active order)
      for (const order of orders) {
        orderId = order.id;
        customerId = order.customerId;

        // Get GHL IDs from customer metadata first, then fallback to order
        ghlAccountId = customer?.getGhlAccountId() || order.ghlAccountId || null;
        ghlLocationId = customer?.getGhlLocationId() || order.ghlLocationId || null;

        // Update order status to CANCELED
        order.status = OrderStatus.CANCELED;
        order.notes = `Subscription canceled: ${subscriptionId}`;
        order.metadata = {
          ...order.metadata,
          subscription_canceled_at: new Date().toISOString(),
          subscription_cancellation_reason: data.cancellation_reason || 'user_requested',
        };
        await this.orderRepository.save(order);

        this.logger.log(`Order ${order.id} marked as CANCELED due to subscription ${subscriptionId}`);
      }

      // Delete GHL account if it exists
      if (ghlAccountId || ghlLocationId) {
        this.logger.log(
          `Deleting GHL account - User: ${ghlAccountId}, Location: ${ghlLocationId}`,
        );

        try {
          const deleteResult = await this.ghlService.deleteAccount(
            ghlAccountId || '',
            ghlLocationId || '',
          );

          // Update orders with deletion result
          for (const order of orders) {
            order.ghlResponse = {
              ...order.ghlResponse,
              deleted: true,
              deletedAt: new Date().toISOString(),
              deletionResult: deleteResult,
            };
            await this.orderRepository.save(order);
          }

          if (deleteResult.success) {
            this.logger.log(`GHL account deleted successfully for subscription: ${subscriptionId}`);

            // Clear GHL IDs from customer metadata after successful deletion
            if (customer) {
              customer.clearGhlAccount();
              await this.customerRepository.save(customer);
              this.logger.log(`GHL account IDs cleared from customer metadata: ${customer.email}`);
            }
          } else {
            this.logger.warn(`GHL account deletion failed: ${deleteResult.message}`);
          }
        } catch (error: any) {
          this.logger.error(`Error deleting GHL account: ${error.message}`);
          // Don't fail the webhook if GHL deletion fails
        }
      } else {
        this.logger.log(`No GHL account found for subscription: ${subscriptionId}`);
      }

      return {
        subscriptionId,
        status: 'canceled',
        orderId,
        customerId,
        ghlAccountId,
        ghlLocationId,
        message: 'Subscription canceled and GHL account deleted',
      };
    } catch (error: any) {
      this.logger.error(`Error handling subscription cancellation: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleSubscriptionUncanceled(data: any): Promise<any> {
    this.logger.log(`Subscription uncanceled: ${data.id}`);

    const subscriptionId = data.id;
    let customerId: string | null = null;

    try {
      // Find all orders associated with this subscription
      const orders = await this.orderRepository.find({
        where: { polarSubscriptionId: subscriptionId },
      });

      if (orders.length === 0) {
        this.logger.warn(`No orders found for uncanceled subscription: ${subscriptionId}`);
        return { subscriptionId, status: 'uncanceled', message: 'No orders found' };
      }

      this.logger.log(`Found ${orders.length} order(s) for uncanceled subscription: ${subscriptionId}`);

      // Get the customer from the first order
      const customer = await this.customerRepository.findOne({
        where: { id: orders[0].customerId },
      });

      if (!customer) {
        this.logger.warn(`Customer not found for subscription: ${subscriptionId}`);
        return { subscriptionId, status: 'uncanceled', message: 'Customer not found' };
      }

      customerId = customer.id;

      // Check if GHL account already exists (it shouldn't after cancellation)
      const existingGhlAccountId = customer.getGhlAccountId();
      const existingGhlLocationId = customer.getGhlLocationId();

      if (existingGhlAccountId && existingGhlLocationId) {
        this.logger.log(
          `GHL account already exists for customer ${customer.email} - skipping recreation`,
        );
        return {
          subscriptionId,
          status: 'uncanceled',
          customerId,
          ghlAccountId: existingGhlAccountId,
          ghlLocationId: existingGhlLocationId,
          message: 'GHL account already exists',
        };
      }

      // Create a new GHL account since the old one was deleted
      this.logger.log(`Recreating GHL account for customer: ${customer.email}`);

      try {
        const ghlResponse = await this.ghlService.createAccountFromOrder(
          `${customer.firstName} ${customer.lastName}`.trim(),
          customer.email,
          customer.metadata?.phone || null,
          customer.businessName || null,
        );

        // Update all orders with the new GHL response and reactivate them
        for (const order of orders) {
          order.ghlResponse = ghlResponse;
          order.status = OrderStatus.COMPLETED;
          order.metadata = {
            ...order.metadata,
            subscription_uncanceled_at: new Date().toISOString(),
          };
          await this.orderRepository.save(order);
          this.logger.log(`Order ${order.id} reactivated from CANCELED to COMPLETED`);
        }

        if (ghlResponse.success) {
          this.logger.log(`GHL account recreated successfully: ${ghlResponse.accountId}`);

          // Store new GHL IDs in customer metadata
          if (ghlResponse.id && ghlResponse.locationId) {
            customer.setGhlAccount(ghlResponse.id, ghlResponse.locationId);
            await this.customerRepository.save(customer);
            this.logger.log(
              `New GHL account IDs stored in customer metadata: ${customer.email}`,
            );
          }

          return {
            subscriptionId,
            status: 'uncanceled',
            customerId,
            ghlAccountId: ghlResponse.id,
            ghlLocationId: ghlResponse.locationId,
            message: 'Subscription uncanceled, GHL account recreated, and orders reactivated',
          };
        } else {
          this.logger.warn(`GHL account recreation failed: ${ghlResponse.message}`);
          return {
            subscriptionId,
            status: 'uncanceled',
            customerId,
            message: `Subscription uncanceled but GHL account creation failed: ${ghlResponse.message}`,
          };
        }
      } catch (error: any) {
        this.logger.error(`Failed to recreate GHL account: ${error.message}`);
        return {
          subscriptionId,
          status: 'uncanceled',
          customerId,
          message: `Subscription uncanceled but GHL account creation failed: ${error.message}`,
        };
      }
    } catch (error: any) {
      this.logger.error(`Error handling subscription uncanceled: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleSubscriptionRevoked(data: any): Promise<any> {
    this.logger.log(`Subscription revoked: ${data.id}`);

    const subscriptionId = data.id;
    let ghlAccountId: string | null = null;
    let ghlLocationId: string | null = null;
    let orderId: string | null = null;
    let customerId: string | null = null;

    try {
      // Find all orders associated with this subscription
      const orders = await this.orderRepository.find({
        where: { polarSubscriptionId: subscriptionId },
      });

      if (orders.length === 0) {
        this.logger.warn(`No orders found for revoked subscription: ${subscriptionId}`);
        return { subscriptionId, status: 'revoked', message: 'No orders found' };
      }

      this.logger.log(`Found ${orders.length} order(s) for revoked subscription: ${subscriptionId}`);

      // Get the customer to check for GHL IDs in metadata
      const customer = await this.customerRepository.findOne({
        where: { id: orders[0].customerId },
      });

      // Process each order
      for (const order of orders) {
        orderId = order.id;
        customerId = order.customerId;

        // Get GHL IDs from customer metadata first, then fallback to order
        ghlAccountId = customer?.getGhlAccountId() || order.ghlAccountId || null;
        ghlLocationId = customer?.getGhlLocationId() || order.ghlLocationId || null;

        // Update order status to CANCELED
        order.status = OrderStatus.CANCELED;
        order.notes = `Subscription revoked: ${subscriptionId}`;
        order.metadata = {
          ...order.metadata,
          subscription_revoked_at: new Date().toISOString(),
          subscription_revoke_reason: data.revoke_reason || 'system_revoked',
        };
        await this.orderRepository.save(order);

        this.logger.log(`Order ${order.id} marked as CANCELED due to subscription revocation ${subscriptionId}`);
      }

      // Delete GHL account if it exists
      if (ghlAccountId || ghlLocationId) {
        this.logger.log(
          `Deleting GHL account (revoked) - User: ${ghlAccountId}, Location: ${ghlLocationId}`,
        );

        try {
          const deleteResult = await this.ghlService.deleteAccount(
            ghlAccountId || '',
            ghlLocationId || '',
          );

          // Update orders with deletion result
          for (const order of orders) {
            order.ghlResponse = {
              ...order.ghlResponse,
              deleted: true,
              deletedAt: new Date().toISOString(),
              deletionResult: deleteResult,
            };
            await this.orderRepository.save(order);
          }

          if (deleteResult.success) {
            this.logger.log(`GHL account deleted successfully for revoked subscription: ${subscriptionId}`);

            // Clear GHL IDs from customer metadata after successful deletion
            if (customer) {
              customer.clearGhlAccount();
              await this.customerRepository.save(customer);
              this.logger.log(`GHL account IDs cleared from customer metadata: ${customer.email}`);
            }
          } else {
            this.logger.warn(`GHL account deletion failed: ${deleteResult.message}`);
          }
        } catch (error: any) {
          this.logger.error(`Error deleting GHL account: ${error.message}`);
          // Don't fail the webhook if GHL deletion fails
        }
      } else {
        this.logger.log(`No GHL account found for revoked subscription: ${subscriptionId}`);
      }

      return {
        subscriptionId,
        status: 'revoked',
        orderId,
        customerId,
        ghlAccountId,
        ghlLocationId,
        message: 'Subscription revoked and GHL account deleted',
      };
    } catch (error: any) {
      this.logger.error(`Error handling subscription revocation: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleSubscriptionPastDue(data: any): Promise<any> {
    this.logger.log(`Subscription past due: ${data.id}`);
    return { subscriptionId: data.id, status: 'past_due' };
  }

  // ==================== ORDER HANDLERS ====================

  private async handleOrderCreated(data: any): Promise<any> {
    this.logger.log(`Order created: ${data.id}`);

    const customer = await this.findOrCreateCustomer(data.customer_id);

    const order = this.orderRepository.create({
      customerId: customer.id,
      polarProductId: data.product_id,
      polarCheckoutId: data.id,
      polarSubscriptionId: data.subscription_id || null,
      amount: data.amount,
      currency: data.currency,
      status: OrderStatus.PENDING,
      metadata: {
        ...data.metadata,
        checkout_id: data.checkout_id,
        subscription_id: data.subscription_id,
        custom_field_data: data.custom_field_data,
      },
    });

    await this.orderRepository.save(order);

    return { orderId: order.id, polarOrderId: data.id };
  }

  private async handleOrderUpdated(data: any): Promise<any> {
    this.logger.log(`Order updated: ${data.id}`);

    const order = await this.orderRepository.findOne({
      where: { polarCheckoutId: data.id },
    });

    if (order) {
      order.metadata = {
        ...order.metadata,
        ...data.metadata,
        subscription_id: data.subscription_id,
      };
      await this.orderRepository.save(order);
    }

    return { orderId: order?.id, polarOrderId: data.id };
  }

  private async handleOrderPaid(data: any): Promise<any> {
    this.logger.log(`Order paid: ${data.id}`);

    const order = await this.orderRepository.findOne({
      where: { polarCheckoutId: data.id },
    });

    if (!order) {
      this.logger.warn(`Order not found for Polar order ID: ${data.id}`);
      return { polarOrderId: data.id, status: 'paid', orderCreated: false };
    }

    // Update order details
    order.status = OrderStatus.COMPLETED;
    order.amount = data.amount;
    order.currency = data.currency;

    // Update subscription info if available
    if (data.subscription_id && !order.polarSubscriptionId) {
      order.polarSubscriptionId = data.subscription_id;
    }

    // Store custom_field_data in order metadata
    if (data.custom_field_data) {
      order.metadata = {
        ...order.metadata,
        subscription_id: data.subscription_id,
        custom_field_data: data.custom_field_data,
      };
    }

    await this.orderRepository.save(order);
    this.logger.log(`Order marked as completed: ${order.id}`);

    // Get customer details
    const customer = await this.customerRepository.findOne({
      where: { id: order.customerId },
    });

    if (customer) {
      // Update customer with data from custom_field_data
      let customerUpdated = false;

      if (data.custom_field_data) {
        if (data.custom_field_data.first_name) {
          customer.firstName = data.custom_field_data.first_name;
          customerUpdated = true;
        }
        if (data.custom_field_data.last_name) {
          customer.lastName = data.custom_field_data.last_name;
          customerUpdated = true;
        }
        if (data.custom_field_data.business) {
          customer.businessName = data.custom_field_data.business;
          customerUpdated = true;
        }
        if (data.custom_field_data.phone) {
          customer.metadata = {
            ...customer.metadata,
            phone: data.custom_field_data.phone,
          };
          customerUpdated = true;
        }
      }

      // Also update customer email from Polar if different
      if (data.customer?.email && data.customer.email !== customer.email) {
        customer.email = data.customer.email;
        customerUpdated = true;
      }

      if (customerUpdated) {
        await this.customerRepository.save(customer);
        this.logger.log(`Customer updated: ${customer.email}`);
      }

      // Create GHL account after successful payment
      this.logger.log(`Creating GHL account for customer: ${customer.email}`);

      try {
        const ghlResponse = await this.ghlService.createAccountFromOrder(
          `${customer.firstName} ${customer.lastName}`.trim(),
          customer.email,
          customer.metadata?.phone || data.custom_field_data?.phone || null,
          customer.businessName || data.custom_field_data?.business || null,
        );

        // Store GHL response in order
        order.ghlResponse = ghlResponse;
        await this.orderRepository.save(order);

        if (ghlResponse.success) {
          this.logger.log(`GHL account created successfully: ${ghlResponse.accountId}`);

          // Store GHL IDs in customer metadata for future reference (cancellation, etc.)
          if (ghlResponse.id && ghlResponse.locationId) {
            customer.setGhlAccount(ghlResponse.id, ghlResponse.locationId);
            await this.customerRepository.save(customer);
            this.logger.log(`GHL account IDs stored in customer metadata: ${customer.email}`);
          }
        } else {
          this.logger.warn(`GHL account creation failed: ${ghlResponse.message}`);
        }
      } catch (error) {
        this.logger.error(`Failed to create GHL account: ${error.message}`);
        // Don't fail the webhook if GHL account creation fails
      }
    }

    return { orderId: order.id, polarOrderId: data.id, status: 'paid' };
  }

  private async handleOrderRefunded(data: any): Promise<any> {
    this.logger.log(`Order refunded: ${data.id}`);

    const order = await this.orderRepository.findOne({
      where: { polarCheckoutId: data.id },
    });

    if (order) {
      order.status = OrderStatus.REFUNDED;
      order.notes = 'Order refunded';
      await this.orderRepository.save(order);
    }

    return { orderId: order?.id, polarOrderId: data.id, status: 'refunded' };
  }

  // ==================== REFUND HANDLERS ====================

  private async handleRefundCreated(data: any): Promise<any> {
    this.logger.log(`Refund created: ${data.id} for order: ${data.order_id}`);

    const order = await this.orderRepository.findOne({
      where: { polarCheckoutId: data.order_id },
    });

    if (order) {
      order.status = OrderStatus.REFUNDED;
      order.notes = `Refunded: ${data.reason}`;
      order.metadata = {
        ...order.metadata,
        refund_id: data.id,
        refund_amount: data.amount,
        refund_reason: data.reason,
      };
      await this.orderRepository.save(order);
    }

    return { orderId: order?.id, refundId: data.id };
  }

  private async handleRefundUpdated(data: any): Promise<any> {
    this.logger.log(`Refund updated: ${data.id}`);
    return { refundId: data.id };
  }

  // ==================== PRODUCT HANDLERS ====================

  private async handleProductEvent(data: any): Promise<any> {
    this.logger.log(`Product event: ${data.id}`);
    return { productId: data.id };
  }

  // ==================== BENEFIT HANDLERS ====================

  private async handleBenefitEvent(data: any): Promise<any> {
    this.logger.log(`Benefit event: ${data.id}`);
    return { benefitId: data.id };
  }

  private async handleBenefitGrantCreated(data: any): Promise<any> {
    this.logger.log(`Benefit grant created: ${data.id} for customer: ${data.customer_id}`);
    return { grantId: data.id, customerId: data.customer_id };
  }

  private async handleBenefitGrantCycled(data: any): Promise<any> {
    this.logger.log(`Benefit grant cycled: ${data.id}`);
    return { grantId: data.id };
  }

  private async handleBenefitGrantUpdated(data: any): Promise<any> {
    this.logger.log(`Benefit grant updated: ${data.id}`);
    return { grantId: data.id };
  }

  private async handleBenefitGrantRevoked(data: any): Promise<any> {
    this.logger.log(`Benefit grant revoked: ${data.id}`);
    return { grantId: data.id };
  }

  // ==================== ORGANIZATION HANDLERS ====================

  private async handleOrganizationUpdated(data: any): Promise<any> {
    this.logger.log(`Organization updated: ${data.id}`);
    return { organizationId: data.id };
  }

  // ==================== CHECKOUT HANDLERS ====================

  private async handleCheckoutEvent(data: any): Promise<any> {
    this.logger.log(`Checkout event: ${data.id}`);
    return { checkoutId: data.id };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Find customer by Polar customer ID or create new one
   */
  private async findOrCreateCustomer(polarCustomerId: string): Promise<Customer> {
    // Try to find existing customer by searching metadata using QueryBuilder
    const customer = await this.customerRepository
      .createQueryBuilder('customer')
      .where("customer.metadata->>'polar_customer_id' = :id", {
        id: polarCustomerId,
      })
      .getOne();

    if (customer) {
      return customer;
    }

    // If not found, create a placeholder customer
    const newCustomer = this.customerRepository.create({
      firstName: 'Polar',
      lastName: 'Customer',
      email: `customer_${polarCustomerId}@polar.temp`,
      businessName: '',
      metadata: { polar_customer_id: polarCustomerId },
    });

    return await this.customerRepository.save(newCustomer);
  }

  /**
   * Get all webhooks
   */
  async findAll(): Promise<Webhook[]> {
    return this.webhookRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get webhook by ID
   */
  async findOne(id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }
    return webhook;
  }

  /**
   * Get webhooks by event type
   */
  async findByEventType(eventType: PolarWebhookEventType): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get webhooks by status
   */
  async findByStatus(status: WebhookStatus): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }
}
