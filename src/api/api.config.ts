import { EncryptionService } from '../encryption/encryption.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiConfig {
  public readonly attendanceApiBaseUrl: string;
  public readonly infotechApiBaseUrl: string;
  public readonly getAttendanceHistoryPath: string;
  public readonly clockinPath: string;
  public readonly getUserInfoPath: string;

  public constructor(private encryptionService: EncryptionService) {
    const attendanceApiBaseUrl = process.env.ATTENDANCE_API_BASE_URL || '';
    const infotechApiBaseUrl = process.env.INFOTECH_API_BASE_URL || '';
    const clockinPath = process.env.CLOCK_IN_PATH || '';
    const getUserInfoPath = process.env.GET_USER_INFO_PATH || '';
    const getAttendanceHistoryPath =
      process.env.GET_ATTENDANCE_HISTORY_PATH || '';

    this.infotechApiBaseUrl =
      this.encryptionService.decryptSync(infotechApiBaseUrl);
    this.attendanceApiBaseUrl =
      this.encryptionService.decryptSync(attendanceApiBaseUrl);
    this.clockinPath = this.encryptionService.decryptSync(clockinPath);
    this.getUserInfoPath = this.encryptionService.decryptSync(getUserInfoPath);
    this.getAttendanceHistoryPath = this.encryptionService.decryptSync(
      getAttendanceHistoryPath,
    );
  }
}
