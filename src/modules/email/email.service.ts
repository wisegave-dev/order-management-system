import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "../config/config.service";
import { firstValueFrom } from "rxjs";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send welcome email after GHL account creation
   */
  async sendWelcomeEmail(
    customerName: string,
    customerEmail: string,
  ): Promise<{ success: boolean; message?: string }> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #e0e0e0; }
          .details p { margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to WiseGave AI Employee</h1>
          </div>
          <div class="content">
            <h2>Hi ${customerName},</h2>
            <p>Your WiseGave AI Employee platform is ready!</p>

            <div class="details">
              <h3>Login Details:</h3>
              <p><strong>URL:</strong> <a href="https://app.gohighlevel.com">https://app.gohighlevel.com</a></p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Password:</strong> WiseGave2026!</p>
            </div>

            <p><strong>Please change your password after first login.</strong></p>

            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>WiseGave Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailPayload = {
      sender: {
        name: "WiseGave Team",
        email: "noreply@wisegave.com",
      },
      to: [
        {
          email: customerEmail,
          name: customerName,
        },
      ],
      subject: "Your WiseGave AI Employee Platform is Ready!",
      htmlContent: htmlContent,
    };

    try {
      this.logger.log(`Sending welcome email to: ${customerEmail}`);

      const response = await firstValueFrom(
        this.httpService.post(this.BREVO_API_URL, emailPayload, {
          headers: {
            accept: "application/json",
            "api-key": this.configService.brevoApiKey,
            "content-type": "application/json",
          },
        }),
      );

      this.logger.log(
        `Welcome email sent successfully to ${customerEmail}: ${JSON.stringify(response.data)}`,
      );
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      this.logger.error(
        `Failed to send welcome email to ${customerEmail}: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `Brevo API error response: ${JSON.stringify(error.response?.data || "No response data")}`,
      );
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  }
}
