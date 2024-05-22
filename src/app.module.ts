import { Module } from '@nestjs/common';
import { EncryptionModule } from './encryption/encryption.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './task/task.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    EncryptionModule,
    PrismaModule,
    UserModule,
    ScheduleModule.forRoot(),
    TaskModule,
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
