import { mongoConfig, redisConfig } from './config/database';

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  adminUserId: process.env.ADMIN_USER_ID || 'default-admin-id',
  port: process.env.PORT || 3000,
  mongoConfig,
  redisConfig
}; 