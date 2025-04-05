import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  limiter(req, res, next);
}; 