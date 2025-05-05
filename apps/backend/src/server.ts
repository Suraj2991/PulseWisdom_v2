import express from 'express';
import { config } from './shared/config';
import { errorHandler } from './shared/middleware/errorHandler';
import { addRequestId } from './shared/middleware/requestId';
import { requestLogger } from './shared/middleware/requestLogger';
import { RateLimiter } from './shared/utils/rateLimiter';
import { container } from './bootstrap';
import { logger } from './shared/logger';

const app = express();

// Middleware
app.use(addRequestId);
app.use(requestLogger);

// Rate limiting middleware
const rateLimiter = new RateLimiter();
app.use((req, res, next) => {
  const key = req.ip || 'unknown';
  if (rateLimiter.isRateLimited(key)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  next();
});

app.use(errorHandler);

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Initialize application
const init = async () => {
  try {
    await container.getServices();
  } catch (error) {
    logger.error('Failed to bootstrap application:', error);
    process.exit(1);
  }
};

init(); 