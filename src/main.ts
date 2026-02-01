import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  await app.listen(3000);

  console.log(`
╔═══════════════════════════════════════════════════════╗
║   Order Management System is running!                ║
║   Port: 3000                                          ║
║   URL: http://localhost:3000                          ║
╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
