import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  Header,
  Req,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { PolarWebhookEventType } from '../database/entities/webhook.entity';

/**
 * Webhook Controller for receiving Polar webhook events
 *
 * Polar will send POST requests to this endpoint with event data
 * Endpoint: POST /webhooks/polar
 */
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Receive webhook from Polar
   *
   * Polar sends webhooks with this structure:
   * {
   *   "id": "evt_xxx",
   *   "type": "order.paid",
   *   "data": { ... },
   *   "created_at": "2024-01-01T00:00:00Z"
   * }
   *
   * For signature verification (optional but recommended):
   * Polar sends signature in header: X-Polar-Signature
   * Format: t=123456,v1=abcdef...
   */
  @Post('polar')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/json')
  async receivePolarWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ): Promise<{ received: boolean; eventId: string }> {
    const signature = headers['x-polar-signature'];

    // Log the raw body for debugging
    this.logger.log(`Raw body type: ${typeof body}`);
    this.logger.log(`Raw body keys: ${Object.keys(body)}`);
    this.logger.log(`Raw body: ${JSON.stringify(body)}`);

    // Handle raw payload - Polar sends different formats
    let webhookEvent: WebhookEventDto;

    // If body is a string (raw), parse it
    if (typeof body === 'string') {
      try {
        webhookEvent = JSON.parse(body);
      } catch (e) {
        this.logger.error(`Failed to parse webhook body: ${e.message}`);
        return {
          received: false,
          eventId: 'unknown',
        };
      }
    } else {
      webhookEvent = body;
    }

    // Polar doesn't send an event ID, so generate one from type + timestamp + data.id
    if (!webhookEvent.id) {
      const dataId = webhookEvent.data?.id || 'unknown';
      webhookEvent.id = `${webhookEvent.type}_${webhookEvent.timestamp}_${dataId}`;
    }

    this.logger.log(
      `Webhook received: ${webhookEvent?.type} | Event ID: ${webhookEvent?.id}`,
    );

    if (signature) {
      this.logger.debug(`Signature present: ${signature.substring(0, 20)}...`);
    }

    try {
      // Process the webhook
      await this.webhooksService.processWebhook(webhookEvent, signature);

      // Return 200 OK to acknowledge receipt
      return {
        received: true,
        eventId: webhookEvent?.id || 'unknown',
      };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);

      // Still return 200 OK to avoid Polar retrying
      // The webhook is saved with FAILED status
      return {
        received: true,
        eventId: webhookEvent?.id || 'unknown',
      };
    }
  }

  /**
   * Get all webhooks (for debugging/monitoring)
   */
  @Get()
  async findAll() {
    return this.webhooksService.findAll();
  }

  /**
   * Get webhook by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }

  /**
   * Get webhooks by event type
   */
  @Get('type/:eventType')
  async findByEventType(@Param('eventType') eventType: PolarWebhookEventType) {
    return this.webhooksService.findByEventType(eventType);
  }
}
