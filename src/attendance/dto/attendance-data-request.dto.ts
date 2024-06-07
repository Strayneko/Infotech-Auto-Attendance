import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AttendanceDataRequestDto {
  public userId?: number;

  @IsNotEmpty()
  public locationName: string;

  @IsNotEmpty()
  public latitude: string;

  @IsNotEmpty()
  public longitude: string;

  @IsOptional()
  public remarks?: string;

  @Transform((param) => param.value.toString())
  @IsNotEmpty()
  public timeZone: string;

  @Transform((param) => +param.value || null)
  public isSubscribeMail: number;

  @Transform((param) => +param.value || null)
  public isImmediate: number;

  @IsNumber()
  @Transform((param) => +param.value)
  public isActive: number;
}
