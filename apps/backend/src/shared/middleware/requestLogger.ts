import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
      };
    }
  }
}

// Create a custom format that includes request ID and user ID if available
const logFormat = ':id :remote-addr :method :url :status :response-time ms :user-id';

// Add token for request ID
morgan.token('id', (req: Request) => req.id || '-');

// Add token for user ID
morgan.token('user-id', (req: Request) => req.user?.id || '-');

// Create the middleware
export const requestLogger = morgan(logFormat, {
  stream: {
    write: (message: string) => {
      console.log(message.trim());
    }
  }
}); 