import { createInfrastructureLayer } from './infrastructure';
import { createApplicationLayer } from './application';

// Initialize infrastructure and application layers
const infrastructure = createInfrastructureLayer();
const application = createApplicationLayer(infrastructure);

export const services = {
  ...infrastructure,
  ...application
} as const;

// Type-safe service accessor
export type Services = typeof services; 