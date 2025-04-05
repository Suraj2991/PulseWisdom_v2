import { ICacheClient } from '../../domain/ports/ICacheClient';
import { IEphemerisClient, EphemerisRequest, CelestialBody } from '../../domain/ports/IEphemerisClient';

export class EphemerisService {
  constructor(
    private readonly cache: ICacheClient,
    private readonly ephemerisClient: IEphemerisClient
  ) {}

  private getCacheKey(date: Date, latitude: number, longitude: number): string {
    return `ephemeris:${date.toISOString()}:${latitude}:${longitude}`;
  }

  async getPlanetaryPositions(date: Date, latitude: number, longitude: number): Promise<CelestialBody> {
    const cacheKey = this.getCacheKey(date, latitude, longitude);
    
    // Try to get from cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate positions
    const positions = await this.ephemerisClient.calculatePositions({
      date,
      latitude,
      longitude
    });

    // Cache the result
    await this.cache.set(cacheKey, JSON.stringify(positions), 3600); // Cache for 1 hour

    return positions;
  }

  async calculateAspects(positions: CelestialBody): Promise<any> {
    return this.ephemerisClient.calculateAspects(positions);
  }

  async calculateHouses(date: Date, latitude: number, longitude: number): Promise<any> {
    return this.ephemerisClient.calculateHouses({
      date,
      latitude,
      longitude
    });
  }
}