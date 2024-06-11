import { IsIn, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateStatusRequestDto {
  @Transform((param) => +param?.value)
  @IsNotEmpty()
  public userId: number;

  @Transform((param) => param?.value?.toLowerCase())
  @IsNotEmpty()
  @IsIn(['enable', 'disable'])
  public status: 'enable' | 'disable';
}
