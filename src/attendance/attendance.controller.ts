import { Body, Controller, Post, Res } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { GetAttendanceHistoryRequestDto } from './dto/get-attendance-history-request.dto';
import { Response } from 'express';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('history')
  public async getAttendanceHistory(
    @Body() body: GetAttendanceHistoryRequestDto,
    @Res() res: Response,
  ) {
    const history = await this.attendanceService.getAttendanceHistory(body);
    let httpCode: number = 200;
    if (history.status === false) httpCode = 400;
    return res.status(httpCode).json(history);
  }
}
