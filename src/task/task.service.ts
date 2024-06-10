import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceService } from '../attendance/attendance.service';
import { MyLoggerService } from '../my-logger/my-logger.service';
import { UserLocationEnum } from '../attendance/enums/user-location.enum';

@Injectable()
export class TaskService {
  public constructor(
    private readonly attendanceService: AttendanceService,
    private readonly logger: MyLoggerService,
  ) {}
  // called monday - friday every 8:10 am asia/jakarta
  @Cron('0 10 1 * * 1-5')
  public async handleClockInCron() {
    this.logger.log('Start clock in cron job');
    await this.attendanceService.dispatchClockInOrClockOutJob(
      'Clock In',
      UserLocationEnum.INDONESIA,
    );
  }

  // called monday - friday every 5:30 pm asia/jakarta
  @Cron('0 31 10 * * 1-5')
  public async handleClockOutCron() {
    this.logger.log('Start clock out cron job');
    await this.attendanceService.dispatchClockInOrClockOutJob(
      'Clock Out',
      UserLocationEnum.INDONESIA,
    );
  }

  // called monday - friday every 9:10 am asia/KL
  @Cron('0 10 2 * * 1-5')
  public async handleMyClockInCron() {
    this.logger.log('Start clock in cron job');
    await this.attendanceService.dispatchClockInOrClockOutJob(
      'Clock In',
      UserLocationEnum.MALAYSIA,
    );
  }

  // called monday - friday every 6:30 pm asia/KL
  @Cron('0 31 11 * * 1-5')
  public async handleMyClockOutCron() {
    this.logger.log('Start clock out cron job');
    await this.attendanceService.dispatchClockInOrClockOutJob(
      'Clock Out',
      UserLocationEnum.MALAYSIA,
    );
  }
}
