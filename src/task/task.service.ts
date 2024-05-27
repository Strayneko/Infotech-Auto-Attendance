import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceService } from '../attendance/attendance.service';
import { BullQueueService } from '../bull-queue/bull-queue.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  public constructor(
    private readonly attendanceService: AttendanceService,
    private readonly bullQueueService: BullQueueService,
  ) {}

  // called monday - friday every 8:25 am asia/jakarta
  @Cron('0 2 2 * * 1-5')
  public async handleClockInCron() {
    this.logger.log('tes');
    // await this.dispatchClockInOrClockOutJob();
  }

  // called monday - friday every 5:30 pm asia/jakarta
  @Cron('0 30 10 * * 1-5')
  public async handleClockOutCron() {
    await this.dispatchClockInOrClockOutJob();
  }

  private async dispatchClockInOrClockOutJob(): Promise<void> {
    const attendances =
      await this.attendanceService.getAttendanceRequiredData();

    for (const attendance of attendances.data) {
      await this.bullQueueService.dispatchAutoClockInQueue(attendance);
    }
  }
}
