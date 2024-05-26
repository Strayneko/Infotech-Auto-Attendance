import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
  imports: [AttendanceModule],
})
export class UserModule {}
