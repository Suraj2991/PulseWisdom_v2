import { HOUSE_SYSTEMS, HouseSystem } from '../../../shared/constants/astrology';
import { ICache } from '../../../infrastructure/cache/ICache';
import { IEphemerisClient } from '../../../domain/ports/IEphemerisClient';

export class HouseService {
  constructor(
    private readonly cache: ICache,
    private readonly ephemerisClient: IEphemerisClient
  ) {}

  /**
   * Calculates the house number for a given longitude
   * @param longitude - The celestial longitude
   * @param cusps - The house cusps
   * @returns The house number (1-12)
   */
  calculateHouse(longitude: number, cusps: number[]): number {
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
   * Gets the house system for a given birth chart
   * @param system - The house system to use
   * @returns The house system configuration
   */
  getHouseSystem(system: HouseSystem = HOUSE_SYSTEMS.PLACIDUS as HouseSystem): { system: HouseSystem } {
    return { system };
  }
} 