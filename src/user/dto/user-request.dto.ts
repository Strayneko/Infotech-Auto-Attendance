import { AttendanceDataRequestDto } from '../../attendance/dto/attendance-data-request.dto';
import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UserRequestDto {
  public id?: number;

  @IsNotEmpty()
  public email: string;

  @IsNotEmpty()
  public deviceId: string;

  @IsNotEmpty()
  public imei: string;

  @IsNotEmpty()
  public token: string;

  @IsNotEmpty()
  @Transform((param) => param.value.toString())
  public customerId: string;

  @IsNotEmpty()
  public idNumber: string;

  @IsNotEmpty()
  @Transform((param) => +param.value)
  @IsNumber()
  public userGroupId?: number;

  @IsNotEmpty()
  public employeeId: string;

  @IsNotEmpty()
  public companyId: number;

  @IsNotEmpty()
  public infotechUserId: number;

  @ValidateNested()
  @Type(() => AttendanceDataRequestDto)
  public attendanceData!: AttendanceDataRequestDto;

  public type?: 'Clock In' | 'Clock Out';
}
