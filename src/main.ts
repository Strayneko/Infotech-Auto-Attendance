import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';
import { UnauthorizedExceptionFilter } from './filters/unauthorized-exception.filter';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryExeptionFilter } from './filters/sentry-exeption.filter';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DNS,
    integrations: [nodeProfilingIntegration()],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });

  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);
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
  app.useGlobalFilters(new SentryExeptionFilter(httpAdapter));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new ValidationExceptionFilter());
  app.useGlobalFilters(new UnauthorizedExceptionFilter());
  await app.listen(+process.env.SERVER_PORT || 3000);
}
bootstrap();
