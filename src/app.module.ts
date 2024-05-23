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
import { BullBoardModule } from '@nestql/bull-board';
import { BullQueueModule } from './bull-queue/bull-queue.module';

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
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT || 6379,
      },
    }),
    BullBoardModule.register(),
    BullQueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
