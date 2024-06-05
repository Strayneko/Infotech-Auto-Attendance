import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetAttendanceHistoryRequestDto {
  @IsNotEmpty()
  public employeeId: string;

  @IsNotEmpty()
  @Transform((param) => param.value.toString())
  public customerId: number;

  @IsNotEmpty()
  public companyId: number;

  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  public imei: string;

  @IsNotEmpty()
  public token: string;
}
