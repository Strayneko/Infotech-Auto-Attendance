import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { UserModule } from '../user/user.module';

@Module({
  providers: [AttendanceService],
  exports: [AttendanceService],
  controllers: [AttendanceController],
  imports: [UserModule],
})
export class AttendanceModule {}
