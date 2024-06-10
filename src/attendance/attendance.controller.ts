import {
  Body,
  Controller,
  Post,
  Query,
  Res,
  Get,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { GetAttendanceHistoryRequestDto } from './dto/get-attendance-history-request.dto';
import { Response } from 'express';
import { OneTimeTokenGuard } from '../one-time-token/one-time-token.guard';
import { AttendanceHistoryQueryDto } from './attendance-history-query.dto';
import { UserLocationEnum } from './enums/user-location.enum';

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

  @UseGuards(new OneTimeTokenGuard())
  @Post('location')
  public async getLocationHistory(
    @Body() body: GetAttendanceHistoryRequestDto,
    @Res() res: Response,
  ) {
    const data = await this.attendanceService.getLocationHistory(body);

    return res.status(data.code).json(data);
  }

  @Get('cron/:type/:location')
  public async handleCron(
    @Param('type') type: string,
    @Param('location') location: string,
    @Res() res: Response,
  ) {
    const clockType = type == 'in' ? 'Clock In' : 'Clock Out';
    if (!['indonesia', 'malaysia'].includes(location.toLowerCase())) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        code: HttpStatus.BAD_REQUEST,
        message: 'Invalid Location.',
      });
    }

    const locationId =
      location.toLowerCase() === 'indonesia'
        ? UserLocationEnum.INDONESIA
        : UserLocationEnum.MALAYSIA;
    await this.attendanceService.dispatchClockInOrClockOutJob(
      clockType,
      locationId,
    );
    return res.status(HttpStatus.OK).json({
      status: true,
      code: HttpStatus.OK,
      message: `Clock ${type} cron job dispatched for ${location} users`,
    });
  }
}
