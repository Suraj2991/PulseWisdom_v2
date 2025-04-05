import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './shared/middleware/errorHandler';
import { requestLogger } from './shared/middleware/requestLogger';
import { addRequestId } from './shared/middleware/requestId';
import { setupRoutes } from './api/routes';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance middleware
app.use(compression());

// Request tracking
app.use(addRequestId);
app.use(requestLogger);

// Setup routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

export default app; 