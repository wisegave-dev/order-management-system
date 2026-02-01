import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Base DTO for receiving Polar webhook events
 * Polar sends webhook data in this format:
 * {
 *   "id": "evt_xxx",  // Optional - may not be present
 *   "type": "order.paid",
 *   "timestamp": "2024-01-01T00:00:00Z",
 *   "data": { ... }
 * }
 */
export class WebhookEventDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  data: Record<string, any>;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  created_at?: string;
}

/**
 * Customer data from webhook
 */
export interface PolarCustomer {
  id: string;
  email: string;
  name: string;
  billing_address: any;
  metadata?: Record<string, any>;
  created_at: string;
  modified_at: string;
}

/**
 * Subscription data from webhook
 */
export interface PolarSubscription {
  id: string;
  status: string;
  customer_id: string;
  product_id: string;
  amount: number;
  currency: string;
  recurring_interval: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Order data from webhook
 */
export interface PolarOrder {
  id: string;
  status: string;
  customer_id: string;
  product_id: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Refund data from webhook
 */
export interface PolarRefund {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  order_id: string;
  created_at: string;
}

/**
 * Product data from webhook
 */
export interface PolarProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  price_amount: number;
  price_currency: string;
  created_at: string;
  updated_at: string;
}

/**
 * Benefit data from webhook
 */
export interface PolarBenefit {
  id: string;
  description: string;
  type: string;
  created_at: string;
  updated_at: string;
}

/**
 * Benefit Grant data from webhook
 */
export interface PolarBenefitGrant {
  id: string;
  customer_id: string;
  benefit_id: string;
  granted_at: string;
  expires_at?: string;
  properties?: Record<string, any>;
}
