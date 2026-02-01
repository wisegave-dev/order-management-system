import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Polar Webhook Signature Verification
 *
 * Polar signs webhook requests with a signature in the header: X-Polar-Signature
 * Format: t=1234567890,v1=abcdef123456...
 *
 * The signature is computed as: HMAC-SHA256(webhookSecret, timestamp + rawBody)
 */

export interface WebhookSignature {
  timestamp: number;
  signature: string;
}

export class WebhookSignatureUtil {
  /**
   * Parse Polar signature header
   * Expected format: t=1234567890,v1=abcdef123456...
   */
  static parseSignature(signatureHeader: string): WebhookSignature | null {
    if (!signatureHeader) {
      return null;
    }

    const parts = signatureHeader.split(',');
    const result: WebhookSignature = { timestamp: 0, signature: '' };

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        result.timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        result.signature = value;
      }
    }

    if (!result.timestamp || !result.signature) {
      return null;
    }

    return result;
  }

  /**
   * Verify webhook signature
   *
   * @param signatureHeader - Value from X-Polar-Signature header
   * @param rawBody - Raw request body as string
   * @param webhookSecret - Your Polar webhook secret
   * @param toleranceSeconds - Tolerance for timestamp verification (default: 5 minutes)
   */
  static verify(
    signatureHeader: string,
    rawBody: string,
    webhookSecret: string,
    toleranceSeconds: number = 300,
  ): boolean {
    const parsed = this.parseSignature(signatureHeader);

    if (!parsed) {
      throw new Error('Invalid signature format');
    }

    // Check timestamp to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parsed.timestamp) > toleranceSeconds) {
      throw new Error(
        `Timestamp outside tolerance range. Difference: ${Math.abs(now - parsed.timestamp)}s`,
      );
    }

    // Compute expected signature
    const payload = `${parsed.timestamp}${rawBody}`;
    const expectedSignature = this.computeSignature(payload, webhookSecret);

    // Constant-time comparison to prevent timing attacks
    return this.safeCompare(expectedSignature, parsed.signature);
  }

  /**
   * Compute HMAC-SHA256 signature
   */
  static computeSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    // Use timingSafeEqual for constant-time comparison
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');

    try {
      return timingSafeEqual(bufferA, bufferB);
    } catch {
      return false;
    }
  }

  /**
   * Extract webhook secret from environment
   */
  static getWebhookSecret(): string {
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('POLAR_WEBHOOK_SECRET environment variable is not set');
    }
    return secret;
  }
}
