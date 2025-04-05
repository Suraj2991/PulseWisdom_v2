import mongoose from 'mongoose';
import { config } from './config';
import app from './app';
import { services } from './bootstrap/services';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongo.url, {
      dbName: config.mongo.dbName,
      ...config.mongo.options
    });
    console.log('Connected to MongoDB');

    // Initialize Redis connection
    await services.cache.connect();
    console.log('Connected to Redis');

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connections
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
        
        await services.cache.disconnect();
        console.log('Redis connection closed');
        
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 