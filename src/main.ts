import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════╗
║   Order Management System is running!                ║
║   Port: ${port}                                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
