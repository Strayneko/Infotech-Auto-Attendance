import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MyLoggerService } from '../my-logger/my-logger.service';
import { OnEvent } from '@nestjs/event-emitter';

export type MailType = {
  recipient: string;
  subject: string;
};

@Injectable()
export class EmailService {
  public constructor(
    private readonly mailerService: MailerService,
    private readonly logger: MyLoggerService,
  ) {}

  @OnEvent('mail:dispatch')
  public async notificationMail(data: MailType) {
    try {
      await this.mailerService.sendMail({
        to: data.recipient,
        subject: data.subject,
        html: `<p style="font-weight: bold; text-align: center">This is an email from auto clock in/clock out for infotech</p>`,
      });
      this.logger.log(`Mail has been sent to ${data.recipient}.`);
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}
