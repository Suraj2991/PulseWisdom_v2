import { Express } from 'express';
import { healthRouter } from './health';

export const setupRoutes = (app: Express) => {
  // Health check route
  app.use('/health', healthRouter);

  // Add more routes here as we develop them
  // app.use('/api/v1/users', userRouter);
  // app.use('/api/v1/charts', chartRouter);
  // app.use('/api/v1/insights', insightRouter);
}; 