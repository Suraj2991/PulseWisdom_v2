import { ICache } from '../../../infrastructure/cache/ICache';
import { 
  AspectResponse,
  HouseResponse,
  DateTime,
  DateTime as DomainDateTime,
  GeoPosition,
  BirthChart,
  CelestialBody,
  CelestialBodyService,
  AspectService,
  HouseService,
  EphemerisErrorHandler
} from '../../ephemeris';
import { logger } from '../../../shared/logger';
import { AppError } from '../../../domain/errors';
import { CacheUtils } from '../../../infrastructure/cache/CacheUtils';
import { BaseEphemerisService } from './BaseEphemerisService';
import { EphemerisClient } from '../clients/EphemerisClient';

export class EphemerisService extends BaseEphemerisService {
  constructor(
    protected readonly ephemerisClient: EphemerisClient,
    protected readonly cache: ICache,
    protected readonly celestialBodyService: CelestialBodyService,
    protected readonly aspectService: AspectService,
    protected readonly houseService: HouseService,
    protected readonly errorHandler: EphemerisErrorHandler
  ) {
    super(ephemerisClient, cache, celestialBodyService, aspectService, houseService, errorHandler);
  }

  async calculateBirthChart(datetime: DomainDateTime, location: GeoPosition): Promise<BirthChart> {
    return super.calculateBirthChart(datetime, location);
  }

  async calculatePositions(datetime: DomainDateTime, location: GeoPosition): Promise<CelestialBody[]> {
    return super.calculatePositions(datetime, location);
  }

  async calculateHouses(datetime: DomainDateTime, location: GeoPosition): Promise<HouseResponse[]> {
    return super.calculateHouses(datetime, location);
  }

  async calculateAspects(bodies: CelestialBody[]): Promise<AspectResponse[]> {
    return super.calculateAspects(bodies);
  }

  async getPlanetaryPositions(date: DomainDateTime, latitude: number, longitude: number): Promise<CelestialBody[]> {
    const dateWithDefaults = this.normalizeDate(date);
    const cacheKey = CacheUtils.getEphemerisKey(dateWithDefaults, latitude, longitude);
    
    try {
      this.logStartPositionCalculation(date);
      
      const cached = await this.getCachedPositions(cacheKey);
      if (cached) {
        this.logCacheHit(date);
        return cached;
      }

      const positions = await this.calculateAndCachePositions(dateWithDefaults, latitude, longitude, cacheKey);
      this.logCompletion(date, positions.length);
      
      return positions;
    } catch (error) {
      this.handlePositionError(error);
    }
  }

  private normalizeDate(date: { year: number; month: number; day: number; hour: number; minute: number; second?: number; timezone?: string }): DateTime {
    return {
      year: date.year,
      month: date.month,
      day: date.day,
      hour: date.hour,
      minute: date.minute,
      second: date.second ?? 0,
      timezone: date.timezone ?? 'UTC'
    };
  }

  private logStartPositionCalculation(date: DomainDateTime): void {
    logger.info('Starting planetary position calculation', { 
      date: `${date.year}-${date.month}-${date.day}`,
      location: 'REDACTED' // Don't log exact coordinates
    });
  }

  private async getCachedPositions(cacheKey: string): Promise<CelestialBody[] | null> {
    return this.cache.get<CelestialBody[]>(cacheKey);
  }

  private logCacheHit(date: DomainDateTime): void {
    logger.debug('Retrieved planetary positions from cache', { 
      date: `${date.year}-${date.month}-${date.day}` 
    });
  }

  private async calculateAndCachePositions(
    date: DomainDateTime,
    latitude: number,
    longitude: number,
    cacheKey: string
  ): Promise<CelestialBody[]> {
    const positions = await this.calculatePositions(date, { latitude, longitude });
    await this.cachePositions(cacheKey, positions);
    return positions;
  }

  private async cachePositions(cacheKey: string, positions: CelestialBody[]): Promise<void> {
    try {
      await this.cache.set(cacheKey, positions, CacheUtils.TTL.MEDIUM);
      logger.debug('Cached planetary positions', { 
        cacheKey 
      });
    } catch (error) {
      logger.error('Cache set error', { error });
    }
  }

  private logCompletion(date: DomainDateTime, positionCount: number): void {
    logger.info('Completed planetary position calculation', { 
      date: `${date.year}-${date.month}-${date.day}`,
      bodyCount: positionCount 
    });
  }

  private handlePositionError(error: unknown): never {
    logger.error('Cache get error', { error });
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to get planetary positions: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }

  private handleError(message: string, error: unknown): Error {
    logger.error(message, { 
      error,
      service: 'EphemerisService',
      timestamp: new Date().toISOString()
    });
    if (error instanceof AppError) {
      return error;
    }
    return new AppError(message + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}