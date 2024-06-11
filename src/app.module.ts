import { Module } from '@nestjs/common';
import { EncryptionModule } from './encryption/encryption.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './task/task.module';
import { ApiModule } from './api/api.module';
import { AttendanceModule } from './attendance/attendance.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { BullQueueModule } from './bull-queue/bull-queue.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { LoggerModule } from 'nestjs-rollbar';
import { EmailModule } from './email/email.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HelperModule } from './helper/helper.module';

const redis = process.env.REDIS_SOCK_PATH
  ? {
      path: process.env.REDIS_SOCK_PATH,
    }
  : {
      password: process.env.REDIS_PASSWORD || '',
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT || 6379,
    };

@Module({
  imports: [
    EncryptionModule,
    PrismaModule,
    UserModule,
    ScheduleModule.forRoot(),
    TaskModule,
    ApiModule,
    AttendanceModule,
    EventEmitterModule.forRoot({
      delimiter: ':',
    }),
    BullModule.forRoot({
      redis,
    }),
    BullQueueModule,
    CacheModule.register({ isGlobal: true }),
    LoggerModule.forRoot({
      accessToken: process.env.ROLLBAR_TOKEN,
      environment: process.env.NODE_ENV,
    }),
    EmailModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: +process.env.MAIL_PORT,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `Auto attendance ${process.env.MAIL_SENDER}`,
      },
    }),
    HelperModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
