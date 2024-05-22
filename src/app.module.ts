import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EncryptionModule } from './encryption/encryption.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    EncryptionModule,
    PrismaModule,
    UserModule,
    ScheduleModule.forRoot(),
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
