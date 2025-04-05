import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import birthChartRoutes from './routes/birthChart.routes';
import lifeThemeRoutes from './routes/lifeTheme.routes';
import transitRoutes from './routes/transit.routes';
import insightRoutes from './routes/insight.routes';
import { errorHandler } from './shared/middleware/errorHandler';
import { validationErrorHandler } from './shared/middleware/validationErrorHandler';
import routes from './routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/birth-charts', birthChartRoutes);
app.use('/api/life-themes', lifeThemeRoutes);
app.use('/api/transits', transitRoutes);
app.use('/api/insights', insightRoutes);
app.use(routes);

// Error handling middleware
// Validation errors should be handled first
app.use(validationErrorHandler);
// Then handle all other errors
app.use(errorHandler);

export default app; 