import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ---- Log the real error for the developer ----
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // ---- Determine the status and message safely ----
    let status: number;
    let message: string | object;

    try {
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.getResponse();
      } else if (exception instanceof Error) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';
      }
    } catch {
      // If even extracting the message fails, provide a generic fallback
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    // ---- Always return valid JSON ----
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
