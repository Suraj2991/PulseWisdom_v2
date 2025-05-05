import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare module 'express' {
  interface Request {
    id?: string;
  }
}

export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.id || uuidv4();
  next();
}; 