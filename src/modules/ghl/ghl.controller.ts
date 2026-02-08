import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { GhlService } from './ghl.service';
import { CreateGhlAccountDto } from './dto/create-ghl-account.dto';

@Controller('ghl')
export class GhlController {
  constructor(private readonly ghlService: GhlService) {}

  /**
   * Create a new GHL account
   * POST /ghl/account
   */
  @Post('account')
  async createAccount(@Body() body: CreateGhlAccountDto) {
    return this.ghlService.createAccount({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
    });
  }

  /**
   * Create account from simple data
   * POST /ghl/account/create
   */
  @Post('account/create')
  async createAccountSimple(@Body() body: {
    name: string;
    email: string;
    phone?: string;
  }) {
    return this.ghlService.createAccountFromOrder(
      body.name,
      body.email,
      body.phone,
    );
  }

  /**
   * Get account by ID
   * GET /ghl/account/:id
   */
  @Get('account/:id')
  async getAccount(@Param('id') id: string) {
    try {
      return await this.ghlService.getAccount(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch account',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
