import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { MyLoggerModule } from '../my-logger/my-logger.module';

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
  imports: [MyLoggerModule.register({ serviceName: EncryptionService.name })],
})
export class EncryptionModule {}
