import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(private readonly configService: NestConfigService) {
    this.validateConfig();
  }

  // ============================================
  // Application Configuration
  // ============================================
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  // ============================================
  // Database Configuration
  // ============================================
  get dbHost(): string {
    return this.configService.get<string>('DB_HOST', 'localhost');
  }

  get dbPort(): number {
    return this.configService.get<number>('DB_PORT', 3306);
  }

  get dbUsername(): string {
    return this.configService.get<string>('DB_USERNAME', 'root');
  }

  get dbPassword(): string {
    return this.configService.get<string>('DB_PASSWORD', '');
  }

  get dbDatabase(): string {
    return this.configService.get<string>('DB_DATABASE', 'order_management');
  }

  // ============================================
  // Polar Webhook Configuration
  // ============================================
  get polarWebhookSecret(): string {
    const secret = this.configService.get<string>('POLAR_WEBHOOK_SECRET');
    if (!secret) {
      throw new Error('POLAR_WEBHOOK_SECRET is required but not defined');
    }
    return secret;
  }

  // ============================================
  // GoHighLevel API Configuration
  // ============================================
  get ghlApiKey(): string {
    const key = this.configService.get<string>('GHL_API_KEY');
    if (!key) {
      throw new Error('GHL_API_KEY is required but not defined');
    }
    return key;
  }

  get ghlApiUrl(): string {
    return this.configService.get<string>(
      'GHL_API_URL',
      'https://services.leadconnectorhq.com',
    );
  }

  get ghlAgencyId(): string {
    const id = this.configService.get<string>('GHL_AGENCY_ID');
    if (!id) {
      throw new Error('GHL_AGENCY_ID is required but not defined');
    }
    return id;
  }

  get ghlDefaultSnapshotId(): string {
    return this.configService.get<string>('GHL_SNAPSHOT_ID', '');
  }

  get ghlDefaultTimezone(): string {
    return this.configService.get<string>('GHL_DEFAULT_TIMEZONE', 'America/New_York');
  }

  // ============================================
  // Email Configuration
  // ============================================
  get smtpHost(): string {
    return this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
  }

  get smtpPort(): number {
    return this.configService.get<number>('SMTP_PORT', 587);
  }

  get smtpUser(): string {
    const user = this.configService.get<string>('SMTP_USER');
    if (!user) {
      throw new Error('SMTP_USER is required but not defined');
    }
    return user;
  }

  get smtpPassword(): string {
    const password = this.configService.get<string>('SMTP_PASSWORD');
    if (!password) {
      throw new Error('SMTP_PASSWORD is required but not defined');
    }
    return password;
  }

  get emailFrom(): string {
    return this.configService.get<string>('EMAIL_FROM', 'noreply@yourdomain.com');
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Validate that all required configuration is present
   */
  private validateConfig(): void {
    const requiredVars = [
      'POLAR_WEBHOOK_SECRET',
      'GHL_API_KEY',
      'GHL_AGENCY_ID',
      'SMTP_USER',
      'SMTP_PASSWORD',
    ];

    const missingVars: string[] = [];

    for (const varName of requiredVars) {
      if (!this.configService.get<string>(varName)) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      this.logger.error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
      throw new Error(
        `Configuration error: Missing ${missingVars.length} required environment variable(s): ${missingVars.join(', ')}`,
      );
    }

    this.logger.log('✅ Configuration validated successfully');
  }

  /**
   * Get all configuration for debugging
   */
  getAllConfig(): Record<string, any> {
    return {
      nodeEnv: this.nodeEnv,
      port: this.port,
      database: {
        host: this.dbHost,
        port: this.dbPort,
        database: this.dbDatabase,
        username: this.dbUsername,
      },
      ghl: {
        apiUrl: this.ghlApiUrl,
        agencyId: this.ghlAgencyId,
        hasApiKey: !!this.ghlApiKey,
      },
      polar: {
        hasWebhookSecret: !!this.polarWebhookSecret,
      },
      email: {
        host: this.smtpHost,
        port: this.smtpPort,
        from: this.emailFrom,
        user: this.smtpUser,
      },
    };
  }
}
