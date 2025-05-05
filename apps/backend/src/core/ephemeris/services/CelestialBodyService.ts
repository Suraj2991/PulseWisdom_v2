import { CelestialPosition, CelestialBody } from '../../ephemeris';
import { ZodiacSign, CELESTIAL_BODIES } from '../../../shared/constants/astrology';
import { ICache } from '../../../infrastructure/cache/ICache';
import { getSignFromLongitude } from '../../insight';

export class CelestialBodyService {
  private static idCounter = 0;

  constructor(private readonly cache: ICache) {}

  private generateId(): number {
    return ++CelestialBodyService.idCounter;
  }

  /**
   * Gets the zodiac sign from a given longitude
   * @param longitude - The celestial longitude in degrees
   * @returns The corresponding zodiac sign
   */
  getSignFromLongitude(longitude: number): ZodiacSign {
    return getSignFromLongitude(longitude);
  }

  /**
   * Gets the longitude within a sign (0-29.999... degrees)
   * @param longitude - The celestial longitude in degrees
   * @returns The longitude within the current sign
   */
  getSignLongitude(longitude: number): number {
    return longitude % 30;
  }

  /**
   * Converts an ephemeris celestial position to a domain celestial body
   * @param position - The ephemeris position
   * @param name - The name of the celestial body
   * @returns The domain celestial body
   */
  convertToDomainCelestialBody(position: CelestialPosition, name: string): CelestialBody {
    return {
      id: this.generateId(),
      name,
      longitude: position.longitude,
      latitude: position.latitude,
      speed: position.speed,
      house: 1, // Default to house 1 since it's optional in CelestialPosition
      sign: this.getSignFromLongitude(position.longitude),
      retrograde: position.speed < 0
    };
  }

  /**
   * Gets a celestial position by name from an ephemeris celestial body
   * @param positions - The ephemeris celestial body
   * @param name - The name of the celestial body
   * @returns The celestial position or null if not found
   */
  getCelestialPositionByName(positions: Record<string, unknown>, name: string): CelestialPosition | null {
    const position = positions[name];
    return position && typeof position === 'object' && 'longitude' in position ? position as CelestialPosition : null;
  }

  /**
   * Checks if a celestial body is a standard planet (not a node or other special point)
   * @param name - The name of the celestial body
   * @returns Whether the body is a standard planet
   */
  isStandardPlanet(name: string): boolean {
    return !['northNode', 'southNode'].includes(name);
  }

  /**
   * Gets a celestial body by name from an array of bodies
   * @param bodies - Array of celestial bodies
   * @param name - Name of the body to find (must be a key in CELESTIAL_BODIES)
   * @returns The found celestial body or undefined
   */
  getBody<T extends CelestialBody>(bodies: T[], name: keyof typeof CELESTIAL_BODIES): T | undefined {
    return bodies.find(b => b.name === name);
  }
} 