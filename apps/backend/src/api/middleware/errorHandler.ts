import { Request, Response, NextFunction } from 'express';
import { ValidationError, AuthError, NotFoundError, DatabaseError } from '../../domain/errors';
import { logger } from '../../shared/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { method, url, ip, headers } = req;
  const userAgent = headers['user-agent'] || 'unknown';
  const userId = req.user?.id || 'anonymous';

  // Log the error with context
  logger.error('Request error', {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    request: {
      method,
      url,
      ip,
      userAgent,
      userId
    },
    timestamp: new Date().toISOString()
  });

  if (error instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: error.message,
      type: 'ValidationError'
    });
  }

  if (error instanceof AuthError) {
    return res.status(401).json({
      status: 'error',
      message: error.message,
      type: 'AuthError'
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      status: 'error',
      message: error.message,
      type: 'NotFoundError'
    });
  }

  if (error instanceof DatabaseError) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      type: 'DatabaseError'
    });
  }

  // Default error
  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    type: 'ServerError'
  });
}; 