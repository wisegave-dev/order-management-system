import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
}
