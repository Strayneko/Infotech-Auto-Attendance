import {
  Body,
  Controller,
  Post,
  Query,
  Res,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { GetAttendanceHistoryRequestDto } from './dto/get-attendance-history-request.dto';
import { Response } from 'express';
import { OneTimeTokenGuard } from '../one-time-token/one-time-token.guard';
import { AttendanceHistoryQueryDto } from './attendance-history-query.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(new OneTimeTokenGuard())
  @Post('history')
  public async getAttendanceHistory(
    @Body() body: GetAttendanceHistoryRequestDto,
    @Res() res: Response,
    @Query() query: AttendanceHistoryQueryDto,
  ) {
    const getLastItem: boolean = query.getLast === 1;

    const history: any = await this.attendanceService.getAttendanceHistory(
      body,
      getLastItem,
      query.page,
      query.perPage,
    );
    let httpCode: number = 200;
    if (history.status === false) httpCode = 400;
    return res.status(httpCode).json(history);
  }

  @Get('cron/:type')
  public async handleCron(@Param('type') type: string) {
    const clockType = type == 'in' ? 'Clock In' : 'Clock Out';
    await this.attendanceService.dispatchClockInOrClockOutJob(clockType);
    return { status: true };
  }
}
