import { CelestialBody } from '../../../domain/types/ephemeris.types';
import { CelestialPosition } from '../../../domain/ports/IEphemerisClient';
import { ZODIAC_SIGNS, ZodiacSign } from '../../../shared/constants/astrology';
import { ICache } from '../../../infrastructure/cache/ICache';

export class CelestialBodyService {
  constructor(private readonly cache: ICache) {}

  /**
   * Gets the zodiac sign from a given longitude
   * @param longitude - The celestial longitude in degrees
   * @returns The corresponding zodiac sign
   */
  getSignFromLongitude(longitude: number): ZodiacSign {
    const signIndex = Math.floor(longitude / 30) % 12;
    return ZODIAC_SIGNS[signIndex];
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
   * @param positions - The ephemeris celestial body
   * @param name - The name of the celestial body
   * @returns The celestial position or null if not found
   */
  getCelestialPositionByName(positions: Record<string, unknown>, name: string): CelestialPosition | null {
    const position = positions[name];
    return position && typeof position === 'object' && 'longitude' in position ? position as CelestialPosition : null;
  }
} 