import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';

export enum PolarWebhookEventType {
  // Checkout events
  CHECKOUT_CREATED = 'checkout.created',
  CHECKOUT_UPDATED = 'checkout.updated',

  // Customer events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',
  CUSTOMER_STATE_CHANGED = 'customer.state_changed',

  // Customer Seat events
  CUSTOMER_SEAT_ASSIGNED = 'customer_seat.assigned',
  CUSTOMER_SEAT_CLAIMED = 'customer_seat.claimed',
  CUSTOMER_SEAT_REVOKED = 'customer_seat.revoked',

  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_PAID = 'order.paid',
  ORDER_REFUNDED = 'order.refunded',

  // Subscription events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_ACTIVE = 'subscription.active',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
  SUBSCRIPTION_UNCANCELED = 'subscription.uncanceled',
  SUBSCRIPTION_REVOKED = 'subscription.revoked',
  SUBSCRIPTION_PAST_DUE = 'subscription.past_due',

  // Refund events
  REFUND_CREATED = 'refund.created',
  REFUND_UPDATED = 'refund.updated',

  // Product events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',

  // Benefit events
  BENEFIT_CREATED = 'benefit.created',
  BENEFIT_UPDATED = 'benefit.updated',

  // Benefit Grant events
  BENEFIT_GRANT_CREATED = 'benefit_grant.created',
  BENEFIT_GRANT_CYCLED = 'benefit_grant.cycled',
  BENEFIT_GRANT_UPDATED = 'benefit_grant.updated',
  BENEFIT_GRANT_REVOKED = 'benefit_grant.revoked',

  // Organization events
  ORGANIZATION_UPDATED = 'organization.updated',
}

export enum WebhookStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('webhooks')
export class Webhook extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index()
  eventId: string;

  @Column({
    type: 'enum',
    enum: PolarWebhookEventType,
    name: 'event_type',
  })
  @Index()
  eventType: PolarWebhookEventType;

  @Column({
    type: 'enum',
    enum: WebhookStatus,
    default: WebhookStatus.PENDING,
    name: 'status',
  })
  @Index()
  status: WebhookStatus;

  @Column({ type: 'json', name: 'payload' })
  payload: Record<string, any>;

  @Column({ type: 'json', name: 'processed_data', nullable: true })
  processedData: Record<string, any>;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', length: 255, name: 'polar_customer_id', nullable: true })
  @Index()
  polarCustomerId: string;

  @Column({ type: 'varchar', length: 255, name: 'polar_subscription_id', nullable: true })
  @Index()
  polarSubscriptionId: string;

  @Column({ type: 'varchar', length: 255, name: 'polar_order_id', nullable: true })
  @Index()
  polarOrderId: string;

  @Column({ type: 'varchar', length: 255, name: 'polar_product_id', nullable: true })
  @Index()
  polarProductId: string;

  @Column({ type: 'int', name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', name: 'processed_at', nullable: true })
  processedAt: Date;

  @Column({ type: 'varchar', length: 255, name: 'signature', nullable: true })
  signature: string;
}
