import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('ATTENDANCE_CLOCK_IN')
export class AttendanceAutoClockInProcess {
  public constructor(private readonly eventEmitter: EventEmitter2) {}

  @Process('auto-clock-in')
  public handleAttendanceClockIn(job: Job) {
    console.log('job processed');
    this.eventEmitter.emit('autoClockIn:dispatch', job.data);
  }
}
