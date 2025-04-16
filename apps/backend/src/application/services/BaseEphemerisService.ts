import { IEphemerisClient, EphemerisRequest, AspectResponse, HouseResponse, CelestialPosition, CelestialBody as IEphemerisCelestialBody } from '../../domain/ports/IEphemerisClient';
import { ICache } from '../../infrastructure/cache/ICache';
import { CelestialBodyService } from './ephemeris/CelestialBodyService';
import { AspectService } from './ephemeris/AspectService';
import { HouseService } from './ephemeris/HouseService';
import { EphemerisErrorHandler } from './ephemeris/EphemerisErrorHandler';
import { ValidationUtils } from '../../shared/utils/validation';
import { BaseService } from './BaseService';
import { CelestialBody } from '../../domain/types/ephemeris.types';
import { 
  ZODIAC_SIGNS, 
  ASPECT_ORBS, 
  ASPECT_ANGLES, 
  PLANET_STRENGTHS,
  HOUSE_SYSTEMS,
  AspectType,
  HouseSystem,
  ZodiacSign
} from '../../shared/constants/astrology';
import { logger } from '../../shared/logger';
import { DateTime, GeoPosition, CelestialBody as DomainCelestialBody, BirthChart } from '../../domain/types/ephemeris.types';
import { IBirthChartData } from '../../shared/utils/validation';
import { EphemerisAdapter } from '../../domain/adapters/ephemeris.adapters';

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
    const signIndex = Math.floor(longitude / 30) % 12;
    return ZODIAC_SIGNS[signIndex];
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
   * Creates an empty birth chart data object with basic validation
   * @param datetime - The date and time of birth
   * @param location - The geographic location of birth
   * @returns A validated birth chart data object
   */
  protected createEmptyBirthChartData(datetime: DateTime, location: GeoPosition): IBirthChartData {
    ValidationUtils.validateDateTime(datetime);
    ValidationUtils.validateLocation(location);
    return { datetime, location };
  }

  /**
   * Calculates planetary positions for a given request
   */
  protected async calculatePositions(datetime: DateTime, location: GeoPosition): Promise<DomainCelestialBody[]> {
    return this.errorHandler.withErrorHandling(
      async () => {
        ValidationUtils.validateDateTime(datetime);
        ValidationUtils.validateLocation(location);

        const request: EphemerisRequest = {
          date: EphemerisAdapter.toDate(datetime),
          latitude: location.latitude,
          longitude: location.longitude
        };

        const positions = await this.ephemerisClient.calculatePositions(request);
        const houses = await this.calculateHouses(datetime, location);
        return EphemerisAdapter.toDomainCelestialBodies(positions, houses);
      },
      { operation: 'calculatePositions', datetime, location }
    );
  }

  /**
   * Calculates house cusps for a given date and location
   */
  protected async calculateHouses(datetime: DateTime, location: GeoPosition): Promise<HouseResponse[]> {
    return this.errorHandler.withErrorHandling(
      async () => {
        ValidationUtils.validateDateTime(datetime);
        ValidationUtils.validateLocation(location);

        const request: EphemerisRequest = {
          date: EphemerisAdapter.toDate(datetime),
          latitude: location.latitude,
          longitude: location.longitude
        };

        return this.ephemerisClient.calculateHouses(request);
      },
      { operation: 'calculateHouses', datetime, location }
    );
  }

  /**
   * Calculates aspects between celestial bodies
   */
  protected async calculateAspects(bodies: DomainCelestialBody[]): Promise<AspectResponse[]> {
    return this.errorHandler.withErrorHandling(
      async () => {
        if (!Array.isArray(bodies) || bodies.length === 0) {
          throw new Error('Invalid celestial bodies array');
        }

        // Convert domain bodies to ephemeris format
        const ephemerisBodies: IEphemerisCelestialBody = {
          sun: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          moon: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          mercury: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          venus: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          mars: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          jupiter: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          saturn: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          uranus: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          neptune: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          pluto: { longitude: 0, latitude: 0, speed: 0, distance: 0, declination: 0, rightAscension: 0, isRetrograde: false },
          name: '',
          longitude: 0,
          latitude: 0,
          speed: 0
        };

        // Update positions from domain bodies
        for (const body of bodies) {
          const key = body.name.toLowerCase();
          if (key in ephemerisBodies) {
            (ephemerisBodies as any)[key] = {
              longitude: body.longitude,
              latitude: body.latitude,
              speed: body.speed,
              distance: 0,
              declination: 0,
              rightAscension: 0,
              isRetrograde: body.speed < 0
            };
          }
        }

        return this.ephemerisClient.calculateAspects(ephemerisBodies);
      },
      { operation: 'calculateAspects', bodiesCount: bodies.length }
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
    body1: DomainCelestialBody,
    body2: DomainCelestialBody,
    aspectType: AspectType,
    orb: number
  ): 'high' | 'medium' | 'low' {
    // Base strength on orb
    const maxOrb = ASPECT_ORBS[aspectType];
    const orbStrength = 1 - (orb / maxOrb);
    
    // Consider planet strengths
    const planet1Strength = PLANET_STRENGTHS[body1.name.toLowerCase() as keyof typeof PLANET_STRENGTHS] || 1;
    const planet2Strength = PLANET_STRENGTHS[body2.name.toLowerCase() as keyof typeof PLANET_STRENGTHS] || 1;
    const planetaryStrength = (planet1Strength + planet2Strength) / 2;
    
    // Calculate total strength
    const totalStrength = orbStrength * planetaryStrength;
    
    // Return strength level
    if (totalStrength > 0.8) return 'high';
    if (totalStrength > 0.5) return 'medium';
    return 'low';
  }

  /**
   * Determines if an aspect is applying (planets moving towards exact aspect)
   * @param body1 - The first celestial body
   * @param body2 - The second celestial body
   * @param aspectType - The type of aspect
   * @returns Whether the aspect is applying
   */
  protected isAspectApplying(body1: CelestialBody, body2: CelestialBody, aspectType: AspectType): boolean {
    const angle = ASPECT_ANGLES[aspectType];
    const diff = Math.abs(body1.longitude - body2.longitude);
    const applyingDiff = diff > 180 ? 360 - diff : diff;
    return applyingDiff < angle;
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
    // Find the house that contains this longitude
    for (let i = 0; i < cusps.length; i++) {
      const nextCusp = cusps[(i + 1) % cusps.length];
      if (longitude >= cusps[i] && longitude < nextCusp) {
        return i + 1;
      }
    }
    return 1; // Default to first house if not found
  }

  /**
   * Calculates a complete birth chart
   * @param datetime - The date and time of birth
   * @param location - The geographic location of birth
   * @returns The calculated birth chart
   */
  protected async calculateBirthChart(datetime: DateTime, location: GeoPosition): Promise<BirthChart> {
    return this.errorHandler.withErrorHandling(
      async () => {
        ValidationUtils.validateDateTime(datetime);
        ValidationUtils.validateLocation(location);

        const bodies = await this.calculatePositions(datetime, location);
        const houses = await this.calculateHouses(datetime, location);
        const aspects = await this.calculateAspects(bodies);

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
          sun: bodies.find(b => b.name === 'sun')?.sign || '',
          moon: bodies.find(b => b.name === 'moon')?.sign || '',
          ascendant: houses[0].cusp,
          planets: bodies.filter(b => b.name !== 'northNode' && b.name !== 'southNode').map(b => ({
            name: b.name,
            sign: b.sign,
            house: b.house,
            degree: b.signLongitude
          })),
          housePlacements: houses.map(h => ({
            house: h.number,
            sign: EphemerisAdapter.getSignFromLongitude(h.cusp)
          })),
          chiron: bodies.find(b => b.name === 'chiron') ? {
            sign: bodies.find(b => b.name === 'chiron')!.sign,
            house: bodies.find(b => b.name === 'chiron')!.house,
            degree: bodies.find(b => b.name === 'chiron')!.signLongitude
          } : { sign: '', house: 1, degree: 0 },
          northNode: {
            sign: bodies.find(b => b.name === 'northNode')?.sign || '',
            house: bodies.find(b => b.name === 'northNode')?.house || 1,
            degree: bodies.find(b => b.name === 'northNode')?.signLongitude || 0
          },
          southNode: {
            sign: bodies.find(b => b.name === 'southNode')?.sign || '',
            house: bodies.find(b => b.name === 'southNode')?.house || 1,
            degree: bodies.find(b => b.name === 'southNode')?.signLongitude || 0
          }
        };
      },
      { operation: 'createBirthChart', datetime, location }
    );
  }

  /**
   * Logs astrology-related errors with context
   * @param error - The error object
   * @param context - Additional context for the error
   */
  protected logAstrologyError(error: unknown, context: Record<string, unknown>): void {
    logger.error('Astrology calculation error', { error, ...context });
  }
} 