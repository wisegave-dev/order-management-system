import { IsEnum, IsNumber, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../../database/entities/order.entity';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

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
