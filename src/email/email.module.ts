import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MyLoggerModule } from '../my-logger/my-logger.module';

@Module({
  providers: [EmailService],
  imports: [MyLoggerModule.register({ serviceName: EmailService.name })],
})
export class EmailModule {}
