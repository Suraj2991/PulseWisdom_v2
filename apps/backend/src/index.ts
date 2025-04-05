import express from 'express';
import cors from 'cors';
import { RedisCache } from './infrastructure/cache/RedisCache';
import { EphemerisService } from './services/EphemerisService';
import { BirthChartService } from './services/BirthChartService';
import { LifeThemeService } from './services/LifeThemeService';
import { InsightService } from './services/InsightService';
import { AIService } from './services/AIService';
import { UserService } from './services/UserService';
import { AuthService } from './services/AuthService';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './shared/middleware/auth';
import birthChartRoutes from './routes/birthChart.routes';
import insightRoutes from './routes/insight.routes';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';

const app = express();
const port = process.env.PORT || 3000;

// Initialize services
const cache = new RedisCache('redis://localhost:6379');
const ephemerisService = new EphemerisService(cache, 'http://localhost:3000');
const birthChartService = new BirthChartService(cache, ephemerisService);
const aiService = new AIService();
const lifeThemeService = new LifeThemeService(cache, ephemerisService, aiService);
const insightService = new InsightService(cache, ephemerisService, lifeThemeService);
const userService = new UserService(cache, birthChartService);
const authService = new AuthService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(authenticate);

// Routes
app.use('/api/birth-charts', birthChartRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 