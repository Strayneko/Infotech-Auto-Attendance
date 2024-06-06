import { IsNotEmpty } from 'class-validator';

export class MeRequestDto {
  @IsNotEmpty()
  public token: string;
}
