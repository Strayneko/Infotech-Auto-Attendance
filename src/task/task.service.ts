import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceService } from '../attendance/attendance.service';
import { BullQueueService } from '../bull-queue/bull-queue.service';
import { MyLoggerService } from '../my-logger/my-logger.service';
import { Constants } from '../constants';

@Injectable()
export class TaskService {
  public constructor(
    private readonly attendanceService: AttendanceService,
    private readonly bullQueueService: BullQueueService,
    private readonly logger: MyLoggerService,
  ) {}

  // called monday - friday every 8:25 am asia/jakarta
  @Cron('0 40 2 * * 1-5')
  public async handleClockInCron() {
    this.logger.log('tes');
    await this.dispatchClockInOrClockOutJob('Clock In');
  }

  // called monday - friday every 5:30 pm asia/jakarta
  @Cron('0 35 17 * * 1-5')
  public async handleClockOutCron() {
    this.logger.log('Start clocking out cron job');
    await this.dispatchClockInOrClockOutJob('Clock Out');
  }

  private async dispatchClockInOrClockOutJob(type: string): Promise<void> {
    const attendances =
      await this.attendanceService.getAttendanceRequiredData();
    console.log(attendances);

    for (const attendance of attendances.data) {
      // get random delay from 5 seconds to 10 minutes
      const delay: number =
        Math.floor(Math.random() * Constants.TEN_MINUTES) +
        Constants.FIVE_SECONDS;
      await this.bullQueueService.dispatchAutoClockInQueue(
        {
          ...attendance,
          type,
        },
        { delay },
      );
    }
  }
}
