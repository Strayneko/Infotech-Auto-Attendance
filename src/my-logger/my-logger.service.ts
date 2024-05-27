import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { RollbarLogger } from 'nestjs-rollbar';

@Injectable()
export class MyLoggerService implements LoggerService {
  private readonly logger: Logger;
  public constructor(
    @Inject('LOGGER_OPTIONS') private options: Record<string, any>,
    private readonly rollbarLogger: RollbarLogger,
  ) {
    this.logger = new Logger(options.serviceName);
  }
  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]) {
    this.logger.log(message, ...optionalParams);
    this.rollbarLogger.log(message, ...optionalParams);
  }

  /**
   * Write a 'fatal' level log.
   */
  fatal(message: any, ...optionalParams: any[]) {
    this.logger.fatal(message, ...optionalParams);
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]) {
    this.logger.error(message, ...optionalParams);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, ...optionalParams);
  }

  /**
   * Write a 'debug' level log.
   */
  debug?(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, ...optionalParams);
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: any, ...optionalParams: any[]) {
    this.logger.verbose(message, ...optionalParams);
  }
}
