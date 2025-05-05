import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

declare module 'express' {
  interface Request {
    id?: string;
    user?: {
      id: string;
    };
  }
}

interface RequestLogData {
  method: string;
  url: string;
  status?: number;
  duration?: number;
  ip: string;
  userAgent?: string;
  userId: string;
  timestamp: string;
}

// Create the middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log incoming request
  const logData: RequestLogData = {
    method: req.method,
    url: req.originalUrl || req.url || '/',
    ip: req.ip || 'unknown',
    userAgent: req.get('user-agent') || undefined,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  };

  logger.info('Incoming request', logData);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    const responseLogData: RequestLogData = {
      ...logData,
      status: res.statusCode,
      duration,
    };

    if (res.statusCode >= 500) {
      logger.error(message, responseLogData);
    } else if (res.statusCode >= 400) {
      logger.warn(message, responseLogData);
    } else {
      logger.info(message, responseLogData);
    }
  });

  next();
};

export const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const logData: Pick<RequestLogData, 'method' | 'url' | 'ip'> & { requestId?: string } = {
    method: req.method,
    url: req.url || '/',
    requestId: req.id,
    ip: req.ip || 'unknown'
  };
  
  logger.info('Incoming request', logData);
  next();
}; 