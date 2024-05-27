import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MyLoggerService } from '../../my-logger/my-logger.service';

@Processor('ATTENDANCE_CLOCK_IN')
export class AttendanceAutoClockInProcess {
  public constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: MyLoggerService,
  ) {}

  @Process('auto-clock-in')
  public handleAttendanceClockIn(job: Job) {
    this.logger.log(`Processing ${job.data?.type} for ${job.data.email}`);
    this.eventEmitter.emit('autoClockIn:dispatch', job.data);
  }
}
