import dotenv from 'dotenv';
import { MongoClientOptions } from 'mongodb';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  
  // MongoDB Configuration
  mongo: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'pulsewisdom',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as MongoClientOptions
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 10000,
      reconnectStrategy: (retries: number) => Math.min(retries * 50, 1000)
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },

  // Ephemeris Service Configuration
  ephemeris: {
    apiUrl: process.env.EPHEMERIS_API_URL || 'http://localhost:5000',
    cacheExpiry: 3600 // 1 hour
  },

  // Email Configuration
  email: {
    from: process.env.EMAIL_FROM || 'noreply@pulsewisdom.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  }
} as const;

export type Config = typeof config; 