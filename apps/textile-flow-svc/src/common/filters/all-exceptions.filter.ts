import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type HttpExceptionResponse =
  | string
  | {
      message?: string | string[];
      error?: string;
      statusCode?: number;
      [key: string]: unknown;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message: HttpExceptionResponse =
      exception instanceof HttpException
        ? (exception.getResponse() as HttpExceptionResponse)
        : {
            message:
              exception instanceof Error
                ? exception.message
                : 'Internal server error',
          };

    const requestBody = request.body as unknown;

    console.error(`[${request.method}] ${request.url} Error:`, {
      status,
      message,
      body: requestBody,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(isRecord(message) ? message : { message }),
    });
  }
}
