import { config } from './shared/config';
import app from './app';
import { initializeServices } from './bootstrap/services';
import { logger } from './shared/logger';
import { DatabaseService } from './infrastructure/database';
import { closeConnections } from './shared/database';
import { ConfigurationError } from './domain/errors';

const startServer = async () => {
  try {
    // Initialize database service
    const dbService = DatabaseService.getInstance();
    await dbService.initialize();
    logger.info('Connected to MongoDB');

    // Initialize services
    const services = await initializeServices();

    // Initialize Redis connection
    await services.cacheClient.connect();
    logger.info('Connected to Redis');

    // Start the server
    const server = app.listen(config.port, () => {
      logger.info('Server started', {
        port: config.port,
        environment: process.env.NODE_ENV || 'development'
      });
    });

    /**
     * Graceful shutdown handler
     * Ensures all connections (HTTP, MongoDB, Redis) are properly closed
     * before the process exits
     */
    const shutdown = async () => {
      logger.info('Initiating graceful shutdown...');
      
      // Close HTTP server first to stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close all database connections (MongoDB and Redis)
          await closeConnections();
          logger.info('All database connections closed successfully');
        } catch (error) {
          logger.error('Error during database shutdown:', error);
          throw new ConfigurationError('Failed to close database connections during shutdown');
        }
        
        process.exit(0);
      });
    };

    // Handle shutdown signals (Ctrl+C, container stop, etc.)
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 