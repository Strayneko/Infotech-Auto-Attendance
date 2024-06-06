import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MyLoggerService } from '../../my-logger/my-logger.service';

@Processor('SEND_MAIL_QUEUE')
export class SendMailProcess {
  public constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: MyLoggerService,
  ) {}

  @Process('send-mail')
  public handleAttendanceClockIn(job: Job) {
    this.logger.log(`Processing mail job for ${job.data.email}`);
    this.eventEmitter.emit('mail:dispatch', job.data);
  }
}
