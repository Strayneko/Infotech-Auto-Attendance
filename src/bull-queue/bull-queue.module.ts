import { Global, Module } from '@nestjs/common';
import { BullQueueService } from './bull-queue.service';
import { BullModule } from '@nestjs/bull';
import { AttendanceAutoClockInProcess } from './process/attendance-auto-clock-in.process';

@Global()
@Module({
  providers: [BullQueueService, AttendanceAutoClockInProcess],
  exports: [BullQueueService],
  imports: [
    BullModule.registerQueue({
      name: 'ATTENDANCE_CLOCK_IN',
    }),
  ],
})
export class BullQueueModule {}
