import { AttendanceDataRequestDto } from '../../attendance/dto/attendance-data-request.dto';

export class UserInfoCreatedEvent {
  public attendanceData: AttendanceDataRequestDto;
}
