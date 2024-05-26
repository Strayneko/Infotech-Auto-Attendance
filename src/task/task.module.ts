import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  providers: [TaskService],
  exports: [TaskService],
  imports: [AttendanceModule],
})
export class TaskModule {}
