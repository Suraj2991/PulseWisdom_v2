import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  cors(corsOptions)(req, res, next);
}; 