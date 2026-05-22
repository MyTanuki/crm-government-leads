import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface PgError extends Error {
  code?: string;
  constraint?: string;
  detail?: string;
}

/**
 * Translates errors into the API error shape defined in api/openapi.yaml:
 *   { code, message, details? }
 *
 * Postgres constraint violations are mapped to 422 with a field-keyed
 * `details` object so the frontend can show inline errors.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // NestJS HttpException (validation, auth, not found, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(this.normalizeHttpError(status, body));
      return;
    }

    // Postgres errors
    const pg = exception as PgError;
    if (pg.code) {
      const mapped = this.mapPgError(pg);
      response.status(mapped.status).json(mapped.body);
      return;
    }

    // Unknown — 500
    this.logger.error('Unhandled exception', (exception as Error)?.stack);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }

  private normalizeHttpError(status: number, body: unknown): object {
    if (typeof body === 'object' && body !== null) {
      const b = body as Record<string, unknown>;
      const message = Array.isArray(b.message)
        ? (b.message as string[]).join('; ')
        : (b.message as string) ?? 'Request failed';
      return {
        code: this.codeForStatus(status),
        message,
        ...(Array.isArray(b.message) ? { details: { validation: b.message } } : {}),
      };
    }
    return { code: this.codeForStatus(status), message: String(body) };
  }

  private mapPgError(pg: PgError): { status: number; body: object } {
    switch (pg.code) {
      // unique_violation
      case '23505':
        return {
          status: HttpStatus.CONFLICT,
          body: {
            code: 'DUPLICATE',
            message: 'A record with these values already exists',
            details: { constraint: pg.constraint },
          },
        };
      // foreign_key_violation
      case '23503':
        return {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          body: {
            code: 'INVALID_REFERENCE',
            message: 'Referenced record does not exist',
            details: { constraint: pg.constraint },
          },
        };
      // check_violation
      case '23514':
        return {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          body: {
            code: 'VALIDATION_FAILED',
            message: 'A value failed a database constraint',
            details: { constraint: pg.constraint },
          },
        };
      // not_null_violation
      case '23502':
        return {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          body: {
            code: 'VALIDATION_FAILED',
            message: 'A required field is missing',
            details: { detail: pg.detail },
          },
        };
      // raise_exception (our append-only audit trigger lands here)
      case 'P0001':
        return {
          status: HttpStatus.FORBIDDEN,
          body: {
            code: 'OPERATION_FORBIDDEN',
            message: pg.message,
          },
        };
      default:
        this.logger.error(`Unmapped pg error ${pg.code}`, pg.stack);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: { code: 'DATABASE_ERROR', message: 'Database operation failed' },
        };
    }
  }

  private codeForStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_FAILED',
    };
    return map[status] ?? 'ERROR';
  }
}
