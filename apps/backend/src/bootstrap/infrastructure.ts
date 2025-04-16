import { OpenAIClient } from '../infrastructure/clients/OpenAIClient';
import { EphemerisClient } from '../infrastructure/clients/EphemerisClient';
import { config } from '../config';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { ICache } from '../infrastructure/cache/ICache';

// Initialize infrastructure clients
export const createInfrastructureLayer = (cache: ICache) => {
  const aiClient = new OpenAIClient(config.openai.apiKey);
  const ephemerisClient = new EphemerisClient(config.ephemeris.apiUrl, config.ephemeris.apiKey);

  return {
    cacheClient: cache,
    aiClient,
    ephemerisClient
  } as const;
};

export type InfrastructureLayer = ReturnType<typeof createInfrastructureLayer>;

export const initializeInfrastructure = () => {
  // Initialize cache client
  const cacheClient: ICache = new RedisCache(config.redis.url);

  return {
    cacheClient
  };
}; 