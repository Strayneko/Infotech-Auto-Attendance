import { Global, Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiConfig } from './api.config';
import { MyLoggerModule } from '../my-logger/my-logger.module';

@Global()
@Module({
  providers: [ApiService, ApiConfig],
  exports: [ApiService, ApiConfig],
  imports: [MyLoggerModule.register({ serviceName: ApiService.name })],
})
export class ApiModule {}
