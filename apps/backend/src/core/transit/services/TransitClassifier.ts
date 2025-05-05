import { AspectType } from '../../../shared/constants/astrology';

export enum WindowType {
  Opportunity = 'Opportunity',
  Challenge = 'Challenge',
  Integration = 'Integration'
}

export class TransitClassifier {
  private static readonly CHALLENGING_ASPECTS: AspectType[] = ['opposition', 'square', 'semiSquare', 'sesquisquare', 'quincunx'];
  private static readonly HARMONIOUS_ASPECTS: AspectType[] = ['trine', 'sextile', 'conjunction'];
  private static readonly CHALLENGING_HOUSES = [6, 8, 12];
  private static readonly HARMONIOUS_HOUSES = [1, 4, 7, 10];
  private static readonly TRANSFORMATIVE_PLANETS = ['Pluto', 'Uranus', 'Neptune'];
  private static readonly PERSONAL_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'];
  private static readonly SOCIAL_PLANETS = ['Jupiter', 'Saturn'];

  static getWindowType(aspectType: AspectType, orb: number, planetName: string, houseNum: number): WindowType {
    // Check for challenging aspects
    if (this.CHALLENGING_ASPECTS.includes(aspectType) && orb <= 3) {
      return WindowType.Challenge;
    }

    // Check for harmonious aspects
    if (this.HARMONIOUS_ASPECTS.includes(aspectType) && orb <= 3) {
      return WindowType.Opportunity;
    }

    // Check house placement
    if (this.CHALLENGING_HOUSES.includes(houseNum)) {
      return WindowType.Challenge;
    }

    if (this.HARMONIOUS_HOUSES.includes(houseNum)) {
      return WindowType.Opportunity;
    }

    // Check planet type
    if (this.TRANSFORMATIVE_PLANETS.includes(planetName)) {
      return WindowType.Integration;
    }

    if (this.PERSONAL_PLANETS.includes(planetName)) {
      return WindowType.Opportunity;
    }

    if (this.SOCIAL_PLANETS.includes(planetName)) {
      return WindowType.Integration;
    }

    // Default to Integration for complex or mixed influences
    return WindowType.Integration;
  }

  static isChallengingAspect(aspectType: AspectType): boolean {
    return this.CHALLENGING_ASPECTS.includes(aspectType);
  }

  static isHarmoniousAspect(aspectType: AspectType): boolean {
    return this.HARMONIOUS_ASPECTS.includes(aspectType);
  }

  static isChallengingHouse(houseNum: number): boolean {
    return this.CHALLENGING_HOUSES.includes(houseNum);
  }

  static isHarmoniousHouse(houseNum: number): boolean {
    return this.HARMONIOUS_HOUSES.includes(houseNum);
  }

  static isTransformativePlanet(planetName: string): boolean {
    return this.TRANSFORMATIVE_PLANETS.includes(planetName);
  }

  static isPersonalPlanet(planetName: string): boolean {
    return this.PERSONAL_PLANETS.includes(planetName);
  }

  static isSocialPlanet(planetName: string): boolean {
    return this.SOCIAL_PLANETS.includes(planetName);
  }
} 