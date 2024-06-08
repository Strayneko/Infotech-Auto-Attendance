import { IsIn, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class AttendanceHistoryQueryDto {
  @Transform((param) => +param.value)
  @IsOptional()
  @IsNumber()
  @IsIn([0, 1])
  public getLast?: number;

  @Transform((param) => +param.value)
  @IsNumber()
  @IsOptional()
  @Min(1)
  public page?: number;

  @Transform((param) => +param.value)
  @IsNumber()
  @IsOptional()
  @Min(1)
  public perPage?: number;
}
