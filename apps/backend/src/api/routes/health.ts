import { Router, Request, Response } from 'express';
import { DatabaseService } from '../../infrastructure/database';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const dbService = DatabaseService.getInstance();
  const mongoStatus = dbService.getMongoDb() ? 'connected' : 'disconnected';

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoStatus,
      api: 'healthy'
    }
  });
}); 