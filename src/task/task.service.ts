import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttendanceService } from '../attendance/attendance.service';
import { BullQueueService } from '../bull-queue/bull-queue.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  public constructor(
    private readonly attendanceService: AttendanceService,
    private readonly bullQueueService: BullQueueService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  public async handleCron() {
    const attendances =
      await this.attendanceService.getAttendanceRequiredData();

    console.log('scheduler called');
    for (const attendance of attendances.data) {
      await this.bullQueueService.dispatchAutoClockInQueue(attendance);
    }

    this.logger.debug('Called every 30 seconds');
  }
}
