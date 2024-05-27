import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { AttendanceModule } from '../attendance/attendance.module';
import { MyLoggerModule } from '../my-logger/my-logger.module';

@Module({
  providers: [TaskService],
  exports: [TaskService],
  imports: [
    AttendanceModule,
    MyLoggerModule.register({ serviceName: TaskService.name }),
  ],
})
export class TaskModule {}
