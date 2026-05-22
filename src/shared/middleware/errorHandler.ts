/**
 * Global error handler — catches all errors, returns consistent JSON responses.
 * Never exposes internal error details in production.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors';
import { env } from '../../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log full error in development, minimal in production
  if (!env.IS_PRODUCTION) {
    console.error('[ErrorHandler]', err);
  } else {
    console.error('[ErrorHandler]', err.message);
  }

  // Handle our custom AppError hierarchy
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: (err as any).errors,
    });
    return;
  }

  // Handle PostgreSQL unique constraint violations
  if ((err as unknown as Record<string, unknown>).code === '23505') {
    res.status(409).json({
      success: false,
      message: 'A record with this data already exists.',
      code: 'DUPLICATE_ENTRY',
    });
    return;
  }

  // Handle PostgreSQL check constraint violations
  if ((err as unknown as Record<string, unknown>).code === '23514') {
    res.status(400).json({
      success: false,
      message: 'Operation violates data constraints (e.g., insufficient balance).',
      code: 'CONSTRAINT_VIOLATION',
    });
    return;
  }

  // Handle PostgreSQL foreign key violations
  if ((err as unknown as Record<string, unknown>).code === '23503') {
    res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist.',
      code: 'FOREIGN_KEY_VIOLATION',
    });
    return;
  }

  // Handle timeout errors
  if ((err as unknown as Record<string, unknown>).code === 'ETIMEDOUT' || err.message?.includes('timeout')) {
    res.status(503).json({
      success: false,
      message: 'Request timeout. Please try again.',
      code: 'REQUEST_TIMEOUT',
    });
    return;
  }

  // Unknown errors — never leak details in production
  res.status(500).json({
    success: false,
    message: env.IS_PRODUCTION ? 'Internal server error.' : err.message,
    code: 'INTERNAL_ERROR',
  });
}
