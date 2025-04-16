import { CelestialBody } from '../../../domain/types/ephemeris.types';
import { 
  ASPECT_ORBS, 
  ASPECT_ANGLES, 
  PLANET_STRENGTHS,
  AspectType
} from '../../../shared/constants/astrology';
import { ICache } from '../../../infrastructure/cache/ICache';

export class AspectService {
  constructor(private readonly cache: ICache) {}

  /**
   * Calculates the strength of an aspect between two celestial bodies
   * @param body1 - The first celestial body
   * @param body2 - The second celestial body
   * @param aspectType - The type of aspect
   * @param orb - The orb of the aspect
   * @returns The strength level of the aspect
   */
  calculateAspectStrength(
    body1: CelestialBody,
    body2: CelestialBody,
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
  isAspectApplying(body1: CelestialBody, body2: CelestialBody, aspectType: AspectType): boolean {
    const angle = ASPECT_ANGLES[aspectType];
    const diff = Math.abs(body1.longitude - body2.longitude);
    const applyingDiff = diff > 180 ? 360 - diff : diff;
    return applyingDiff < angle;
  }
} 