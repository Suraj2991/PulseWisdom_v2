import { CelestialBody } from '../../core/ephemeris/types/ephemeris.types';

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];
export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable';
export type DignityStatus = 'rulership' | 'exaltation' | 'detriment' | 'fall' | 'neutral';

interface DignityInfo {
  rulership: ZodiacSign | ZodiacSign[];
  exaltation?: ZodiacSign;
  detriment?: ZodiacSign | ZodiacSign[];
  fall?: ZodiacSign;
}

interface BirthChartBody {
  name: string;
  longitude: number;
}

interface BirthChart {
  bodies: BirthChartBody[];
  houses: {
    cusps: number[];
  };
}

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

  /**
   * Get the dignity status of a celestial body in a sign
   * @param bodyName - The name of the celestial body
   * @param sign - The zodiac sign
   * @returns The dignity status (rulership, exaltation, detriment, fall, or neutral)
   */
  static getDignityStatus(bodyName: string, sign: ZodiacSign): DignityStatus {
    const dignityMap: Record<string, DignityInfo> = {
      Sun: { rulership: 'Leo', exaltation: 'Aries', detriment: 'Aquarius', fall: 'Libra' },
      Moon: { rulership: 'Cancer', exaltation: 'Taurus', detriment: 'Capricorn', fall: 'Scorpio' },
      Mercury: { rulership: ['Gemini', 'Virgo'], detriment: ['Sagittarius', 'Pisces'] },
      Venus: { rulership: ['Taurus', 'Libra'], exaltation: 'Pisces', detriment: ['Scorpio', 'Aries'], fall: 'Virgo' },
      Mars: { rulership: ['Aries', 'Scorpio'], exaltation: 'Capricorn', detriment: ['Libra', 'Taurus'], fall: 'Cancer' },
      Jupiter: { rulership: ['Sagittarius', 'Pisces'], exaltation: 'Cancer', detriment: ['Gemini', 'Virgo'], fall: 'Capricorn' },
      Saturn: { rulership: ['Capricorn', 'Aquarius'], exaltation: 'Libra', detriment: ['Cancer', 'Leo'], fall: 'Aries' },
      Uranus: { rulership: 'Aquarius', exaltation: 'Scorpio' },
      Neptune: { rulership: 'Pisces', exaltation: 'Cancer' },
      Pluto: { rulership: 'Scorpio', exaltation: 'Leo' }
    };

    const dignity = dignityMap[bodyName];
    if (!dignity) return 'neutral';

    if (Array.isArray(dignity.rulership)) {
      if (dignity.rulership.includes(sign)) return 'rulership';
    } else if (dignity.rulership === sign) {
      return 'rulership';
    }

    if (dignity.exaltation === sign) return 'exaltation';

    if (Array.isArray(dignity.detriment)) {
      if (dignity.detriment.includes(sign)) return 'detriment';
    } else if (dignity.detriment === sign) {
      return 'detriment';
    }

    if (dignity.fall === sign) return 'fall';

    return 'neutral';
  }

  /**
   * Get the ruler of a house based on its cusp sign
   * @param cusp - The house cusp longitude
   * @returns The ruling planet name
   */
  static getHouseRuler(cusp: number): string {
    const sign = this.getSignName(cusp);
    const rulers: Record<ZodiacSign, string> = {
      Aries: 'Mars',
      Taurus: 'Venus',
      Gemini: 'Mercury',
      Cancer: 'Moon',
      Leo: 'Sun',
      Virgo: 'Mercury',
      Libra: 'Venus',
      Scorpio: 'Pluto', // Modern ruler, traditionally Mars
      Sagittarius: 'Jupiter',
      Capricorn: 'Saturn',
      Aquarius: 'Uranus', // Modern ruler, traditionally Saturn
      Pisces: 'Neptune' // Modern ruler, traditionally Jupiter
    };
    return rulers[sign] || 'Unknown';
  }

  /**
   * Calculate the element balance in a birth chart
   * @param birthChart - The birth chart data
   * @returns Object containing the count of planets in each element
   */
  static calculateElementBalance(birthChart: BirthChart): Record<Element, number> {
    const elementMap: Record<ZodiacSign, Element> = {
      Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
      Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
      Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
      Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
    };

    const balance: Record<Element, number> = {
      Fire: 0,
      Earth: 0,
      Air: 0,
      Water: 0
    };

    birthChart.bodies.forEach(body => {
      const sign = this.getSignName(body.longitude);
      const element = elementMap[sign];
      if (element) {
        balance[element]++;
      }
    });

    return balance;
  }

  /**
   * Calculate the modality balance in a birth chart
   * @param birthChart - The birth chart data
   * @returns Object containing the count of planets in each modality
   */
  static calculateModalityBalance(birthChart: BirthChart): Record<Modality, number> {
    const modalityMap: Record<ZodiacSign, Modality> = {
      Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
      Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed',
      Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable'
    };

    const balance: Record<Modality, number> = {
      Cardinal: 0,
      Fixed: 0,
      Mutable: 0
    };

    birthChart.bodies.forEach(body => {
      const sign = this.getSignName(body.longitude);
      const modality = modalityMap[sign];
      if (modality) {
        balance[modality]++;
      }
    });

    return balance;
  }

  /**
   * Check if a house is intercepted
   * @param birthChart - The birth chart data
   * @param houseNumber - The house number (1-12)
   * @returns True if the house is intercepted
   */
  static isHouseIntercepted(birthChart: BirthChart, houseNumber: number): boolean {
    const cusps = birthChart.houses.cusps;
    if (!cusps || cusps.length !== 12 || houseNumber < 1 || houseNumber > 12) {
      return false;
    }

    const currentHouse = houseNumber - 1;
    const nextHouse = (currentHouse + 1) % 12;
    
    const currentSign = this.getSignName(cusps[currentHouse]);
    const nextSign = this.getSignName(cusps[nextHouse]);
    
    // If the signs are not consecutive, there's an intercepted sign
    const currentSignIndex = ZODIAC_SIGNS.indexOf(currentSign);
    const nextSignIndex = ZODIAC_SIGNS.indexOf(nextSign);
    
    const expectedNextIndex = (currentSignIndex + 1) % 12;
    return nextSignIndex !== expectedNextIndex;
  }
} 