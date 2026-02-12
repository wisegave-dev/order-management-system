import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Customer } from './customer.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
}

@Entity('orders')
export class Order extends BaseEntity {
  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    name: 'status',
  })
  status: OrderStatus;

  // Polar payment information
  @Column({ type: 'varchar', length: 255, name: 'polar_product_id', nullable: true })
  polarProductId: string;

  @Column({ type: 'varchar', length: 255, name: 'polar_checkout_id', nullable: true })
  polarCheckoutId: string;

  @Column({ type: 'varchar', length: 255, name: 'polar_subscription_id', nullable: true })
  @Index()
  polarSubscriptionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount', nullable: true })
  amount: number;

  @Column({ type: 'varchar', length: 3, name: 'currency', default: 'USD' })
  currency: string;

  // GoHighLevel account information
  @Column({ type: 'varchar', length: 255, name: 'ghl_account_id', nullable: true })
  ghlAccountId: string;

  @Column({ type: 'varchar', length: 255, name: 'ghl_location_id', nullable: true })
  ghlLocationId: string;

  @Column({ type: 'json', name: 'ghl_response', nullable: true })
  ghlResponse: Record<string, any>;

  @Column({ type: 'json', name: 'metadata', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes: string;
}
