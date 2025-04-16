import { Request, Response, NextFunction } from 'express';
import { ValidationError as ExpressValidationError, validationResult } from 'express-validator';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import {
  AppError,
  ValidationError,
  AuthError,
  NotFoundError,
  DatabaseError,
  CacheError,
  ConfigurationError,
  RateLimitError,
  ServiceUnavailableError,
} from '../../domain/errors';
import { logger } from '../logger';

type ErrorSeverity = 'error' | 'warn' | 'info';

type ErrorType = Error | AppError | ValidationError | AuthError | NotFoundError | DatabaseError | CacheError | ConfigurationError | RateLimitError | ServiceUnavailableError | ExpressValidationError[];

const getErrorSeverity = (err: ErrorType): ErrorSeverity => {
  if (err instanceof RateLimitError) return 'warn';
  if (err instanceof ValidationError || err instanceof AuthError) return 'info';
  return 'error';
};

const getRequestId = (req: Request): string => {
  return req?.headers?.['x-request-id'] as string || 'unknown';
};

export const errorHandler = (
  err: ErrorType,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = getRequestId(req);
  const severity = getErrorSeverity(err);
  const timestamp = new Date().toISOString();

  // Enhanced error logging
  const logData = {
    requestId,
    timestamp,
    severity,
    name: Array.isArray(err) ? 'ValidationErrors' : err.name,
    message: Array.isArray(err) ? 'Validation failed' : err.message,
    stack: Array.isArray(err) ? undefined : err.stack,
    details: (err as any).details,
    path: req.path,
    method: req.method,
    ip: req.ip,
  };

  // Log based on severity
  if (severity === 'error') {
    logger.error('Error:', logData);
  } else if (severity === 'warn') {
    logger.warn('Warning:', logData);
  } else {
    logger.info('Info:', logData);
  }

  // Handle express-validator ValidationError
  if (Array.isArray(err)) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.map(e => ({
        field: (e as any).param || (e as any).path,
        message: (e as any).msg || (e as any).message,
      })),
    });
  }

  // Handle JWT errors
  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    return res.status(401).json({
      status: 'error',
      code: err instanceof TokenExpiredError ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: err instanceof TokenExpiredError ? 'Authentication token has expired' : 'Invalid authentication token',
    });
  }

  // Handle specific error types with proper status codes
  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof AuthError) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof DatabaseError) {
    return res.status(500).json({
      status: 'error',
      code: 'DATABASE_ERROR',
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof CacheError) {
    return res.status(500).json({
      status: 'error',
      code: 'CACHE_ERROR',
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof ConfigurationError) {
    return res.status(500).json({
      status: 'error',
      code: 'CONFIG_ERROR',
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof RateLimitError) {
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT',
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof ServiceUnavailableError) {
    return res.status(503).json({
      status: 'error',
      code: 'SERVICE_UNAVAILABLE',
      message: err.message,
      details: err.details,
    });
  }

  // Handle AppError with proper status code
  if (err instanceof AppError) {
    const statusCode = err.statusCode || 500;
    const logData = {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      status: statusCode
    };

    if (statusCode >= 500) {
      logger.error('Server Error:', logData);
    } else if (statusCode >= 400) {
      logger.warn('Client Error:', logData);
    } else {
      logger.info('Application Error:', logData);
    }

    return res.status(statusCode).json({
      status: 'error',
      code: err.code || 'APP_ERROR',
      message: err.message,
      details: err.details,
    });
  }

  // Handle unknown errors
  logger.error('Unhandled Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}; 