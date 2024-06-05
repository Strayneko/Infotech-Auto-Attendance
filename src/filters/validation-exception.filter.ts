import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();
    if (
      typeof exceptionResponse === 'object' &&
      typeof exceptionResponse?.message === 'object'
    ) {
      response.status(status).json({
        status: false,
        code: status,
        message: 'Validation errors',
        errors: exceptionResponse?.message,
      });
      return;
    }
    response.json(status).json({
      status: false,
      code: status,
      message: exception.message,
    });
  }
}
