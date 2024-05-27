import { DynamicModule, Module } from '@nestjs/common';
import { MyLoggerService } from './my-logger.service';

@Module({
  providers: [MyLoggerService],
  exports: [MyLoggerService],
})
export class MyLoggerModule {
  public static register(options: Record<string, any>): DynamicModule {
    return {
      module: MyLoggerModule,
      providers: [
        {
          provide: 'LOGGER_OPTIONS',
          useValue: options,
        },
        MyLoggerService,
      ],
      exports: [MyLoggerService],
    };
  }
}
