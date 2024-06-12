import { Inject, Injectable, ConsoleLogger } from '@nestjs/common';
import { RollbarLogger } from 'nestjs-rollbar';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as moment from 'moment';

@Injectable()
export class MyLoggerService extends ConsoleLogger {
  public constructor(
    @Inject('LOGGER_OPTIONS') protected options: Record<string, any>,
    private readonly rollbarLogger: RollbarLogger,
  ) {
    super();
  }

  protected async logToFile(entry) {
    const formattedEntry = `${Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Chicago',
    }).format(new Date())}\t${entry}\n`;

    try {
      if (!fs.existsSync(path.join(__dirname, '..', '..', 'logs'))) {
        await fsPromises.mkdir(path.join(__dirname, '..', '..', 'logs'));
      }
      const now = moment();
      const fileName = `logs_${now.format('DD-MMMM-YYYY').toLowerCase()}.log`;
      await fsPromises.appendFile(
        path.join(__dirname, '..', '..', 'logs', fileName),
        formattedEntry,
      );
    } catch (e) {
      if (e instanceof Error) console.error(e.message);
    }
  }

  public log(message: any, context?: string) {
    context = context || this.options.serviceName;
    const entry = `${context}\t${message}`;
    this.logToFile(entry);
    super.log(message, context);
    this.rollbarLogger.log(message, context);
  }

  public error(message: any, stackOrContext?: string) {
    stackOrContext = stackOrContext || this.options.serviceName;
    const entry = `${stackOrContext}\t${message}`;
    this.logToFile(entry);
    super.error(message, stackOrContext);
    this.rollbarLogger.error(message, stackOrContext);
  }
}
