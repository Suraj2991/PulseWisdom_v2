import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.id || uuidv4();
  next();
};

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
} 