import { CelestialBody } from '../../core/ephemeris/types/ephemeris.types';

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

export class AstrologyUtils {
  /**
   * Get the zodiac sign name from a longitude value
   * @param longitude - The longitude value (0-360)
   * @returns The name of the zodiac sign
   */
  static getSignName(longitude: number): ZodiacSign {
    return ZODIAC_SIGNS[Math.floor((longitude % 360) / 30)] as ZodiacSign;
  }

  /**
   * Get the degree within a sign from a longitude value
   * @param longitude - The longitude value (0-360)
   * @returns The degree within the sign (0-29)
   */
  static getDegreeInSign(longitude: number): number {
    return longitude % 30;
  }

  /**
   * Check if a planet is retrograde based on its speed
   * @param speed - The planet's speed
   * @returns True if the planet is retrograde
   */
  static isRetrograde(speed: number): boolean {
    return speed < 0;
  }

  /**
   * Get the dignity of a planet in a sign
   * @param body - The celestial body
   * @param sign - The zodiac sign
   * @returns The dignity score (-2 to 2)
   */
  static getDignityScore(body: CelestialBody, sign: ZodiacSign): number {
    // This is a simplified version. In a real implementation,
    // you would have a complete dignity table for each planet in each sign
    const dignityTable: Record<string, Record<ZodiacSign, number>> = {
      Sun: { Leo: 2, Aries: 1, Libra: -1, Aquarius: -2 } as Record<ZodiacSign, number>,
      Moon: { Cancer: 2, Taurus: 1, Capricorn: -1, Scorpio: -2 } as Record<ZodiacSign, number>,
      // Add other planets...
    };

    return dignityTable[body.name]?.[sign] || 0;
  }
} 