import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  providers: [AttendanceService],
  exports: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
