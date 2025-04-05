import { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const addRequestId: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  req.id = uuidv4();
  next();
}; 