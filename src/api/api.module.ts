import { Global, Module } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiConfig } from './api.config';

@Global()
@Module({
  providers: [ApiService, ApiConfig],
  exports: [ApiService, ApiConfig],
})
export class ApiModule {}
