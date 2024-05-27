import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@Processor('ATTENDANCE_CLOCK_IN')
export class AttendanceAutoClockInProcess {
  private logger: Logger = new Logger(AttendanceAutoClockInProcess.name);
  public constructor(private readonly eventEmitter: EventEmitter2) {}

  @Process('auto-clock-in')
  public handleAttendanceClockIn(job: Job) {
    this.logger.log(`Processing ${job.data?.type} for ${job.data.email}`);
    this.eventEmitter.emit('autoClockIn:dispatch', job.data);
  }
}
