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
      redis: {
        password: process.env.REDIS_PASSWORD || '',
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT || 6379,
      },
    }),
    BullQueueModule,
    CacheModule.register({ isGlobal: true }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
