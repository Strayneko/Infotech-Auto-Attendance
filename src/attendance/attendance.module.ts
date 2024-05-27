import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { MyLoggerModule } from '../my-logger/my-logger.module';

@Module({
  providers: [AttendanceService],
  exports: [AttendanceService],
  controllers: [AttendanceController],
  imports: [MyLoggerModule.register({ serviceName: AttendanceService.name })],
})
export class AttendanceModule {}
