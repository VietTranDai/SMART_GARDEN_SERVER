// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const resp = ctx.getResponse();
    const req = ctx.getRequest();
    const isHttpEx = exception instanceof HttpException;

    const status = isHttpEx
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: ErrorResponse = {
      statusCode: status,
      error: isHttpEx
        ? (exception as HttpException).name
        : 'InternalServerError',
      message: isHttpEx
        ? ((exception as HttpException).getResponse() as any)
        : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    resp.status(status).json(errorResponse);
  }
}
