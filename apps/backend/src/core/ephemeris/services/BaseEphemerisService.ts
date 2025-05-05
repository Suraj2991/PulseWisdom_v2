import { IEphemerisClient, EphemerisRequest, AspectResponse, HouseResponse, CelestialPosition } from '../ports/IEphemerisClient';
import { ICache } from '../../../infrastructure/cache/ICache';
import { BaseService } from './BaseService';
import { CommonValidator } from '../../../shared/validation/common';
import { AspectType, ZodiacSign } from '../../../shared/constants/astrology';
import { logger } from '../../../shared/logger';
import { CelestialBody, DateTime, GeoPosition, BirthChart } from '../types/ephemeris.types';
import { getSignFromLongitude } from '../../insight';
import { EphemerisErrorHandler } from './EphemerisErrorHandler';
import { CelestialBodyService } from './CelestialBodyService';
import { AspectService } from './AspectService';
import { HouseService } from './HouseService';
import { EphemerisAdapter } from '../adapters/ephemeris.adapters';

export abstract class BaseEphemerisService extends BaseService {
  constructor(
    protected readonly ephemerisClient: IEphemerisClient,
    protected readonly cache: ICache,
    protected readonly celestialBodyService: CelestialBodyService,
    protected readonly aspectService: AspectService,
    protected readonly houseService: HouseService,
    protected readonly errorHandler: EphemerisErrorHandler
  ) {
    super(cache);
  }

  /**
   * Gets the zodiac sign from a given longitude
   * @param longitude - The celestial longitude in degrees
   * @returns The corresponding zodiac sign
   */
  protected getSignFromLongitude(longitude: number): ZodiacSign {
    return getSignFromLongitude(longitude);
  }

  /**
   * Gets the longitude within a sign (0-29.999... degrees)
   * @param longitude - The celestial longitude in degrees
   * @returns The longitude within the current sign
   */
  protected getSignLongitude(longitude: number): number {
    return longitude % 30;
  }

  /**
   * Calculates planetary positions for a given request
   */
  protected async calculatePositions(datetime: DateTime, location: GeoPosition): Promise<CelestialBody[]> {
    return this.errorHandler.withErrorHandling(
      async () => {
        const request: EphemerisRequest = {
          date: datetime,
          position: location
        };
        return this.ephemerisClient.calculatePositions(request);
      },
      { operation: 'calculatePositions', datetime, location }
    );
  }

  /**
   * Calculates aspects between celestial bodies
   */
  protected async calculateAspects(bodies: CelestialBody[]): Promise<AspectResponse[]> {
    return this.errorHandler.withErrorHandling(
      async () => {
        return this.ephemerisClient.calculateAspects(bodies);
      },
      { operation: 'calculateAspects', bodiesCount: bodies.length }
    );
  }

  /**
   * Calculates houses for a given request
   */
  protected async calculateHouses(datetime: DateTime, location: GeoPosition): Promise<HouseResponse[]> {
    return this.errorHandler.withErrorHandling(
      async () => {
        const request: EphemerisRequest = {
          date: datetime,
          position: location
        };
        return this.ephemerisClient.calculateHouses(request);
      },
      { operation: 'calculateHouses', datetime, location }
    );
  }

  /**
   * Calculates the strength of an aspect between two celestial bodies
   * @param body1 - The first celestial body
   * @param body2 - The second celestial body
   * @param aspectType - The type of aspect
   * @param orb - The orb of the aspect
   * @returns The strength level of the aspect
   */
  protected calculateAspectStrength(
    body1: CelestialBody,
    body2: CelestialBody,
    aspectType: AspectType,
    orb: number
  ): 'high' | 'medium' | 'low' {
    return this.aspectService.calculateAspectStrength(body1, body2, aspectType, orb);
  }

  /**
   * Determines if an aspect is applying (planets moving towards exact aspect)
   * @param body1 - The first celestial body
   * @param body2 - The second celestial body
   * @param aspectType - The type of aspect
   * @returns Whether the aspect is applying
   */
  protected isAspectApplying(body1: CelestialBody, body2: CelestialBody, aspectType: AspectType): boolean {
    return this.aspectService.isAspectApplying(body1, body2, aspectType);
  }

  /**
   * Converts an ephemeris celestial position to a domain celestial body
   * @param position - The ephemeris position
   * @param name - The name of the celestial body
   * @returns The domain celestial body
   */
  protected convertToDomainCelestialBody(position: CelestialPosition, name: string): CelestialBody {
    return {
      id: 0, // This should be assigned based on some logic
      name,
      longitude: position.longitude,
      latitude: position.latitude,
      speed: position.speed,
      house: 1, // Default to first house if not specified
      sign: this.getSignFromLongitude(position.longitude),
      signLongitude: this.getSignLongitude(position.longitude)
    };
  }

  /**
   * Gets a celestial position by name from an ephemeris celestial body
   */
  protected getCelestialPositionByName(positions: Record<string, CelestialPosition>, name: string): CelestialPosition | null {
    return this.celestialBodyService.getCelestialPositionByName(positions, name);
  }

  /**
   * Calculates the house number for a given longitude
   * @param longitude - The celestial longitude
   * @param cusps - The house cusps
   * @returns The house number (1-12)
   */
  protected calculateHouse(longitude: number, cusps: number[]): number {
    // Normalize longitude to 0-360 range
    const normalizedLongitude = ((longitude % 360) + 360) % 360;
    
    // Find the house by checking each cusp range
    for (let i = 0; i < cusps.length; i++) {
      const currentCusp = ((cusps[i] % 360) + 360) % 360;
      const nextCusp = i === cusps.length - 1 
        ? ((cusps[0] % 360) + 360) % 360 
        : ((cusps[i + 1] % 360) + 360) % 360;
      
      // Handle the case where the range crosses 0°/360°
      if (currentCusp > nextCusp) {
        if (normalizedLongitude >= currentCusp || normalizedLongitude < nextCusp) {
          return i + 1;
        }
      } else {
        if (normalizedLongitude >= currentCusp && normalizedLongitude < nextCusp) {
          return i + 1;
        }
      }
    }
    
    // If no house is found (shouldn't happen with valid data), return 1
    return 1;
  }

  /**
   * Calculate a complete birth chart
   * @param datetime - Date and time of birth
   * @param location - Geographic location of birth
   * @returns Birth chart data
   */
  protected async calculateBirthChart(datetime: DateTime, location: GeoPosition): Promise<BirthChart> {
    return this.errorHandler.withErrorHandling(
      async () => {
        CommonValidator.validateDateTime(datetime);
        CommonValidator.validateLocation(location);

        const bodies = await this.calculatePositions(datetime, location);
        const houses = await this.calculateHouses(datetime, location);
        const aspects = await this.calculateAspects(bodies);

        // Find key bodies once using type-safe getBody
        const sun = this.celestialBodyService.getBody(bodies, 'sun');
        const moon = this.celestialBodyService.getBody(bodies, 'moon');
        const chiron = this.celestialBodyService.getBody(bodies, 'chiron');
        const northNode = this.celestialBodyService.getBody(bodies, 'northNode');
        const southNode = this.celestialBodyService.getBody(bodies, 'southNode');

        return {
          datetime,
          location,
          bodies,
          houses: EphemerisAdapter.toDomainHouses(houses),
          aspects: EphemerisAdapter.toDomainAspects(aspects),
          angles: {
            ascendant: houses[0].cusp,
            midheaven: houses[9].cusp,
            descendant: houses[6].cusp,
            imumCoeli: houses[3].cusp
          },
          sun: sun?.sign || '',
          moon: moon?.sign || '',
          ascendant: houses[0].cusp,
          planets: bodies.filter(b => this.celestialBodyService.isStandardPlanet(b.name)).map(b => ({
            name: b.name,
            sign: b.sign,
            house: b.house,
            degree: b.signLongitude
          })),
          housePlacements: houses.map(h => ({
            house: h.number,
            sign: EphemerisAdapter.getSignFromLongitude(h.cusp)
          })),
          chiron: {
            sign: chiron?.sign || '',
            house: chiron?.house || 1,
            degree: chiron?.signLongitude || 0
          },
          northNode: {
            sign: northNode?.sign || '',
            house: northNode?.house || 1,
            degree: northNode?.signLongitude || 0
          },
          southNode: {
            sign: southNode?.sign || '',
            house: southNode?.house || 1,
            degree: southNode?.signLongitude || 0
          }
        };
      },
      { operation: 'calculateBirthChart', datetime, location }
    );
  }

  /**
   * Logs an astrology-related error with context
   */
  protected logAstrologyError(error: unknown, context: Record<string, unknown>): void {
    logger.error('Astrology calculation error', { error, ...context });
  }
} 