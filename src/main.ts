import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
