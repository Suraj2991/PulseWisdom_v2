import { ObjectId } from 'mongodb';
import { ZodiacSign, ZODIAC_SIGNS } from '../../../shared/constants/astrology';
import { Transit } from '../../transit';
import { InsightLog, InsightType, InsightMetadata } from '..';
import { LifeArea } from '../../life-theme';

/**
 * Gets the zodiac sign from a given longitude
 * @param longitude - The celestial longitude in degrees
 * @returns The corresponding zodiac sign
 */
export function getSignFromLongitude(longitude: number): ZodiacSign {
  const signIndex = Math.floor(longitude / 30) % 12;
  return ZODIAC_SIGNS[signIndex];
}

/**
 * Gets the longitude within a sign (0-29.999... degrees)
 * @param longitude - The celestial longitude in degrees
 * @returns The longitude within the current sign
 */
export function getSignLongitude(longitude: number): number {
  return longitude % 30;
}

/**
 * Gets the primary transit from a list of transits based on strength
 * @param transits - Array of transits to analyze
 * @returns The primary transit or undefined if no transits exist
 */
export function getPrimaryTransit(transits: Transit[]): Transit | undefined {
  return transits.reduce((primary, current) => {
    if (!primary) return current;
    return current.strength > primary.strength ? current : primary;
  }, undefined as Transit | undefined);
}

/**
 * Creates an insight log with the given parameters
 * @param type - The type of insight
 * @param content - The content of the insight
 * @param metadata - Additional metadata for the insight
 * @param userId - The user ID (optional)
 * @returns An InsightLog object
 */
export function createInsightLog(
  type: InsightType,
  content: string,
  metadata: InsightMetadata,
  userId?: string
): InsightLog {
  return {
    id: new ObjectId().toString(),
    userId: userId || '',
    insightType: type,
    content,
    generatedAt: new Date(),
    metadata
  };
}

/**
 * Determines the life area for a transit
 * @param transit - The transit to analyze
 * @returns The life area
 */
export function determineTransitLifeArea(transit: Transit): LifeArea {
  // Map transit types to life areas
  if (transit.type === 'conjunction') return LifeArea.PERSONAL_GROWTH;
  if (transit.type === 'opposition') return LifeArea.RELATIONSHIPS;
  if (transit.type === 'trine') return LifeArea.SPIRITUALITY;
  if (transit.type === 'square') return LifeArea.CAREER;
  return LifeArea.PERSONAL_GROWTH;
}

/**
 * Determines the trigger for a transit
 * @param transit - The transit to analyze
 * @returns The trigger type or undefined
 */
export function determineTransitTrigger(transit: Transit): 'chiron' | 'node' | 'return' | 'retrograde' | 'natal' | undefined {
  if (transit.planet === 'Chiron') return 'chiron';
  if (transit.planet === 'North Node' || transit.planet === 'South Node') return 'node';
  if (transit.isRetrograde) return 'retrograde';
  // Check for return transit in a different way
  if (transit.planet === transit.aspectingNatal?.name) return 'return';
  return 'natal';
} 