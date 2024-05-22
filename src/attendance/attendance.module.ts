import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
