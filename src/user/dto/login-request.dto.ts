import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginRequestDto {
  @IsNotEmpty()
  @Transform((param) => param.value.toLowerCase())
  @IsIn(['get', 'login'])
  public type: string;

  @IsOptional()
  public imei?: string;

  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @ValidateIf((o) => o.type === 'get')
  @IsNotEmpty()
  public password?: string;

  @ValidateIf((o) => o.type === 'login')
  @IsNotEmpty()
  public employeeId?: string;
}
