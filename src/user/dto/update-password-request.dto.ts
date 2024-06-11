import { Transform } from 'class-transformer';
import { IsNotEmpty, MinLength } from 'class-validator';

export class UpdatePasswordRequestDto {
  @Transform((param) => +param?.value)
  @IsNotEmpty()
  public userId: number;

  @IsNotEmpty()
  @MinLength(5)
  public appPassword: string;
}
