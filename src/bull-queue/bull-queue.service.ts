import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { JobOptions, Queue } from 'bull';

@Injectable()
export class BullQueueService {
  public constructor(
    @InjectQueue('ATTENDANCE_CLOCK_IN') private readonly attendanceQueue: Queue,
  ) {}

  public async dispatchAutoClockInQueue(
    data: object,
    settings: JobOptions = {},
  ) {
    await this.attendanceQueue.add('auto-clock-in', data, settings);
  }
}
