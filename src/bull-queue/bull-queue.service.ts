import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { JobOptions, Queue } from 'bull';
import { MyLoggerService } from '../my-logger/my-logger.service';

@Injectable()
export class BullQueueService {
  public constructor(
    @InjectQueue('ATTENDANCE_CLOCK_IN') private readonly attendanceQueue: Queue,
    @InjectQueue('SEND_MAIL_QUEUE') private readonly mailQueue: Queue,
    private readonly logger: MyLoggerService,
  ) {}

  public async dispatchAutoClockInQueue(data: any, settings: JobOptions = {}) {
    this.logger.log(
      `${data.type} job added for ${data.email} in ${settings.delay / 1000}s`,
    );

    if (data.attendanceData.isSubscribeMail) {
      const delayInMinutes: number = +settings.delay / 1000 / 60;
      const delayInSeconds: number = +settings.delay / 1000;
      const type: string =
        data.type.toLowerCase() === 'clock in' ? 'clocking in' : 'clocking out';

      const subject: string = data.attendanceData.isImmediate
        ? `You'll ${type} in ${Math.round(delayInSeconds)} seconds.`
        : `You'll ${type} in ${Math.round(delayInMinutes)} minutes.`;
      await this.dispatchMailQueue({
        recipient: data.email,
        subject,
      });
    }
    await this.attendanceQueue.add('auto-clock-in', data, settings);
  }

  public async dispatchMailQueue(data: any, settings: JobOptions = {}) {
    this.logger.log(`Mailing job added for ${data.recipient}`);
    await this.mailQueue.add('send-mail', data, settings);
  }
}
