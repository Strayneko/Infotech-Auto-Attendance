import { Global, Module } from '@nestjs/common';
import { BullQueueService } from './bull-queue.service';
import { BullModule } from '@nestjs/bull';
import { AttendanceAutoClockInProcess } from './process/attendance-auto-clock-in.process';
import { MyLoggerModule } from '../my-logger/my-logger.module';
import { SendMailProcess } from './process/send-mail.process';

@Global()
@Module({
  providers: [BullQueueService, AttendanceAutoClockInProcess, SendMailProcess],
  exports: [BullQueueService],
  imports: [
    MyLoggerModule.register({ serviceName: BullQueueService.name }),
    BullModule.registerQueue({
      name: 'ATTENDANCE_CLOCK_IN',
    }),
    BullModule.registerQueue({
      name: 'SEND_MAIL_QUEUE',
    }),
  ],
})
export class BullQueueModule {}
