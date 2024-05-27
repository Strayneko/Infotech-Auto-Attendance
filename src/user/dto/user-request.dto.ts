import { AttendanceDataRequestDto } from '../../attendance/dto/attendance-data-request.dto';

export class UserRequestDto {
  public id?: number;

  public email: string;

  public deviceId: string;

  public imei: string;

  public token: string;

  public customerId: string;

  public idNumber: string;

  public userGroupId?: number;

  public employeeId: string;

  public companyId: number;

  public infotechUserId: number;

  public attendanceData?: AttendanceDataRequestDto;

  public type?: 'Clock In' | 'Clock Out';
}
