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

  @IsNotEmpty()
  @IsNumber()
  @Transform((param) => +param.value)
  @IsIn([1, 0])
  public isActive: number;
}
