import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MyLoggerService } from '../my-logger/my-logger.service';
import { OnEvent } from '@nestjs/event-emitter';
import { MailType } from '../types/mail-type';

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
        html: data.body,
      });
      this.logger.log(`Mail has been sent to ${data.recipient}.`);
    } catch (e) {
      const message = `Failed to send email to ${data.recipient}. Reason: ${e.message}`;
      this.logger.error(message);
      throw new Error(message);
    }
  }
}
