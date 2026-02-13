import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GhlService } from './ghl.service';
import { GhlController } from './ghl.controller';
import { ConfigModule as AppConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    AppConfigModule,
    EmailModule,
    HttpModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.ghlApiUrl,
        headers: {
          'Authorization': `Bearer ${configService.ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GhlController],
  providers: [GhlService],
  exports: [GhlService],
})
export class GhlModule {}
