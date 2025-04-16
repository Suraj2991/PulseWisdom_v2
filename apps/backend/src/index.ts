import express from 'express';
import cors from 'cors';
import { ICache } from './infrastructure/cache/ICache';
import { createInfrastructureLayer } from './bootstrap/infrastructure';
import { createApplicationLayer } from './bootstrap/application';
import { config } from './config';
import { logger } from './shared/logger';
import { EphemerisService } from './application/services/EphemerisService';
import { BirthChartService } from './application/services/BirthChartService';
import { LifeThemeService } from './application/services/LifeThemeService';
import { InsightService } from './application/services/InsightService';
import { InsightGenerator } from './application/services/insight/InsightGenerator';
import { InsightRepository } from './application/services/insight/InsightRepository';
import { InsightAnalyzer } from './application/services/insight/InsightAnalyzer';
import { AIService } from './application/services/AIService';
import { UserService } from './application/services/UserService';
import { AuthService } from './application/services/AuthService';
import { TransitService } from './application/services/TransitService';
import { errorHandler } from './shared/middleware/errorHandler';
import { createAuthMiddleware } from './shared/middleware/auth';
import birthChartRoutes from './api/routes/birthChart.routes';
import insightRoutes from './api/routes/insight.routes';
import userRoutes from './api/routes/user.routes';
import authRoutes from './api/routes/auth.routes';
import { EphemerisClient } from './infrastructure/clients/EphemerisClient';
import { LLMClient } from './infrastructure/ai/LLMClient';
import { PromptBuilder } from './utils/PromptBuilder';
import { UserRepository } from './infrastructure/database/UserRepository';

const app = express();

// Initialize infrastructure
const infrastructure = createInfrastructureLayer();

// Initialize application
const application = createApplicationLayer(infrastructure);

// Initialize core services
const ephemerisClient = new EphemerisClient('http://localhost:3000', process.env.EPHEMERIS_API_KEY || '');
const ephemerisService = new EphemerisService(ephemerisClient, infrastructure.cacheClient);
const birthChartService = new BirthChartService(infrastructure.cacheClient, ephemerisService);
const llmClient = new LLMClient(process.env.OPENAI_API_KEY || '');
const aiService = new AIService(llmClient, PromptBuilder, infrastructure.cacheClient);
const lifeThemeService = new LifeThemeService(infrastructure.cacheClient, birthChartService, aiService);
const transitService = new TransitService(ephemerisClient, infrastructure.cacheClient, birthChartService);

// Initialize insight components
const insightGenerator = new InsightGenerator(aiService);
const insightRepository = new InsightRepository(infrastructure.cacheClient);
const insightAnalyzer = new InsightAnalyzer(lifeThemeService, transitService);

// Initialize main services
const insightService = new InsightService(
  infrastructure.cacheClient,
  ephemerisService,
  lifeThemeService,
  birthChartService,
  transitService,
  aiService,
  insightGenerator,
  insightRepository,
  insightAnalyzer
);
const userService = new UserService(infrastructure.cacheClient, birthChartService, new UserRepository());
const authService = new AuthService(infrastructure.cacheClient, new UserRepository());

// Middleware
app.use(cors());
app.use(express.json());
app.use(createAuthMiddleware(infrastructure.cacheClient));

// Routes
app.use('/api/birth-charts', birthChartRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
}); 