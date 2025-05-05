import express, { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './shared/middleware/errorHandler';
import { requestLogger } from './shared/middleware/requestLogger';
import { addRequestId } from './shared/middleware/requestId';
import { setupRoutes } from './api';
import { logger } from './shared/logger';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance middleware
app.use(compression() as unknown as RequestHandler);

// Request tracking
app.use(addRequestId);
app.use(requestLogger);

// Setup routes with async error handling
const initializeApp = async () => {
  try {
    await setupRoutes(app);
    // Error handling - must be last
    app.use(errorHandler);
    return app;
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    throw error;
  }
};

export default initializeApp(); 