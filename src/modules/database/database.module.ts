import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule, ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.dbHost,
        port: configService.dbPort,
        username: configService.dbUsername,
        password: configService.dbPassword,
        database: configService.dbDatabase,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.nodeEnv === 'development',
        logging: configService.nodeEnv === 'development',
        timezone: '+00:00', // Store timestamps in UTC
        charset: 'utf8mb4',
        extra: {
          connectionLimit: 10,
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
