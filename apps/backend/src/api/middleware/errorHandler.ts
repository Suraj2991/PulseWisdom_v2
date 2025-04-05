import { Request, Response, NextFunction } from 'express';
import { ValidationError, AuthError, NotFoundError, DatabaseError } from '../types/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

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