import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsObject, MaxLength } from 'class-validator';
import { OrderStatus } from '../../database/entities/order.entity';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  // Polar payment information
  @IsOptional()
  @IsString()
  @MaxLength(255)
  polarProductId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  polarCheckoutId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  // GoHighLevel information
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ghlAccountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ghlLocationId?: string;

  @IsOptional()
  @IsObject()
  ghlResponse?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}
