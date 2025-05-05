import express from 'express';
import { config } from './shared/config';
import { errorHandler } from './shared/middleware/errorHandler';
import { addRequestId } from './shared/middleware/requestId';
import { requestLogger } from './shared/middleware/requestLogger';
import { RateLimiter } from './shared/utils/rateLimiter';
import { container, initializeServices } from './bootstrap';
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

// Initialize application and start server
const init = async () => {
  try {
    // Initialize services
    await initializeServices();

    // Start server
    const PORT = config.port || 3000;
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      await new Promise<void>((resolve) => {
        server.close(async () => {
          try {
            // Cleanup any resources, close connections etc.
            const instance = await container;
            await instance.shutdown();
            logger.info('Server shutdown complete');
            resolve();
            process.exit(0);
          } catch (error) {
            logger.error('Error during cleanup:', error);
            process.exit(1);
          }
        });
      });
    };

    process.on('SIGTERM', () => { void shutdown(); });
    process.on('SIGINT', () => { void shutdown(); });

  } catch (error) {
    logger.error('Failed to bootstrap application:', error);
    process.exit(1);
  }
};

// Handle any uncaught promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Start the application
init().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
}); 