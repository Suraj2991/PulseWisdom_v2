import { createInfrastructureLayer } from './infrastructure';
import { createApplicationLayer } from './application';
import { LifeThemeService } from '../application/services/LifeThemeService';

const infrastructure = createInfrastructureLayer();
const application = createApplicationLayer(infrastructure);

const lifeThemeService = new LifeThemeService(
  infrastructure.cacheClient,
  application.ephemerisService,
  application.aiService
);

export const services = {
  ...infrastructure,
  ...application,
  lifeThemeService,
} as const;

export type Services = typeof services;
