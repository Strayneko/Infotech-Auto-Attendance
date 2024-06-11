import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateLocationRequestDto {
  @Transform((param) => +param?.value)
  @IsNotEmpty()
  public userId: number;

  @IsNotEmpty()
  public latitude: string;

  @IsNotEmpty()
  public longitude: string;

  @IsNotEmpty()
  public locationName: string;

  @IsOptional()
  public timeZone?: string;
}
