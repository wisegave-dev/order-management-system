import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
}
