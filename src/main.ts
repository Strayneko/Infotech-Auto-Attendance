import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';
import { UnauthorizedExceptionFilter } from './filters/unauthorized-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ['Content-Type', 'X-App-Token', 'X-Request-Time', '*'],
    origin: [
      'https://autoattendance.my.id',
      'http://autoattendance.my.id',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new ValidationExceptionFilter());
  app.useGlobalFilters(new UnauthorizedExceptionFilter());
  await app.listen(+process.env.SERVER_PORT || 3000);
}
bootstrap();
