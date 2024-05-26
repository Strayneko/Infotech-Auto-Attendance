export class AttendanceDataRequestDto {
  public userId?: number;

  public locationName: string;

  public latitude: string;

  public longitude: string;

  public remarks?: string;

  public timeZone: string;

  public isActive: boolean;
}
