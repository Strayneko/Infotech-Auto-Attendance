import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceService } from '../attendance/attendance.service';
import { MyLoggerService } from '../my-logger/my-logger.service';

@Injectable()
export class TaskService {
  public constructor(
    private readonly attendanceService: AttendanceService,
    private readonly logger: MyLoggerService,
  ) {}

  // called monday - friday every 8:25 am asia/jakarta
  @Cron('0 10 1 * * 1-5')
  public async handleClockInCron() {
    this.logger.log('Start clock in cron job');
    await this.attendanceService.dispatchClockInOrClockOutJob('Clock In');
  }

  // called monday - friday every 5:30 pm asia/jakarta
  @Cron('0 31 10 * * 1-5')
  public async handleClockOutCron() {
    this.logger.log('Start clock out cron job');
    await this.attendanceService.dispatchClockInOrClockOutJob('Clock Out');
  }
}
