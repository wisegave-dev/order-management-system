import { Controller, Post, Get, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Test endpoint to send welcome email
   * POST /email/test-send
   * Body: { "customerName": "Test User", "customerEmail": "test@example.com" }
   */
  @Post('test-send')
  @HttpCode(HttpStatus.OK)
  async testSendEmail(@Body() body: { customerName: string; customerEmail: string }) {
    const { customerName, customerEmail } = body;

    this.logger.log(`Testing email send to: ${customerEmail}`);

    const result = await this.emailService.sendWelcomeEmail(
      customerName || 'Test User',
      customerEmail,
    );

    return {
      success: result.success,
      message: result.message,
      customerEmail,
      customerName,
    };
  }
}
