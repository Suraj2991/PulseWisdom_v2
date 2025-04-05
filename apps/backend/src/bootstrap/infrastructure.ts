import { RedisClient } from '../infrastructure/clients/RedisClient';
import { OpenAIClient } from '../infrastructure/clients/OpenAIClient';
import { EphemerisClient } from '../infrastructure/clients/EphemerisClient';
import { config } from '../config';

// Initialize infrastructure clients
export const createInfrastructureLayer = () => {
  const cacheClient = new RedisClient(config.redis.url);
  const aiClient = new OpenAIClient(config.openai.apiKey);
  const ephemerisClient = new EphemerisClient(config.ephemeris.apiUrl, config.ephemeris.apiKey);

  return {
    cacheClient,
    aiClient,
    ephemerisClient
  } as const;
};

export type InfrastructureLayer = ReturnType<typeof createInfrastructureLayer>; 