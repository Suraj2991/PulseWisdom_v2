import { Types, Document } from 'mongoose';
import { ICache } from '../infrastructure/cache/ICache';
import { BirthChartService } from './BirthChartService';
import { EphemerisCalculatorSingleton } from './EphemerisCalculatorSingleton';
import { TransitAnalysis, TransitAspect, TransitWindow } from '../types/transit.types';

import { NotFoundError, ValidationError, CalculationError } from '../types/errors';
import { BirthChart as BirthChartModel, IBirthChart } from '../models/BirthChart';

interface TransitAspectCalculation {
  type: string;
  angle: number;
  orb: number;
  isApplying: boolean;
}

interface HouseActivation {
  house: number;
  activatedBy: string[];
  strength: 'high' | 'medium' | 'low';
}

interface SignificantEvent {
  type: 'retrograde' | 'station' | 'cazimi' | 'star_point';
  planet: string;
  date: DateTime;
  description: string;
  strength: 'high' | 'medium' | 'low';
}

export class TransitService {
  private readonly ASPECT_ORBS = {
    conjunction: 8,
    sextile: 6,
    square: 8,
    trine: 8,
    opposition: 8,
    semiSquare: 4,
    sesquisquare: 4,
    quincunx: 3,
    semiSextile: 3
  } as const;

  private readonly ASPECT_ANGLES = {
    conjunction: 0,
    sextile: 60,
    square: 90,
    trine: 120,
    opposition: 180,
    semiSquare: 45,
    sesquisquare: 135,
    quincunx: 150,
    semiSextile: 30
  } as const;

  private readonly PLANET_STRENGTHS: Record<number, number> = {
    0: 1,  // Sun
    1: 1,  // Moon
    2: 1,  // Mercury
    3: 1,  // Venus
    4: 1,  // Mars
    5: 2,  // Jupiter
    6: 2,  // Saturn
    7: 3,  // Uranus
    8: 3,  // Neptune
    9: 3   // Pluto
  };

  private readonly ephemerisCalculator: EphemerisCalculator;

  constructor(
    private readonly cache: ICache,
    private readonly birthChartService: BirthChartService,
    ephemerisCalculator: EphemerisCalculator
  ) {
    this.ephemerisCalculator = ephemerisCalculator;
  }

  async analyzeTransits(birthChartId: string, date: DateTime): Promise<TransitAnalysis> {
    try {
      // Validate date
      if (!this.isValidDate(date)) {
        throw new ValidationError('Invalid date provided');
      }

      // Try cache first
      const cacheKey = this.generateCacheKey(birthChartId, date);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as TransitAnalysis;
      }

      // Get birth chart data
      const birthChart = await this.birthChartService.getBirthChartById(birthChartId) as IBirthChart & Document;
      if (!birthChart) {
        throw new NotFoundError('Birth chart not found');
      }

      // Ensure calculator is initialized
      const calculator = EphemerisCalculatorSingleton.getInstance();
      await calculator.initialize();

      // Convert birth chart bodies to IBodyPosition[]
      const natalBodies = birthChart.bodies.map(body => 
        celestialBodyToBodyPosition(body as CelestialBody, 0)
      );

      // Create a compatible BirthChart object
      const compatibleBirthChart: BirthChartModel = {
        ...birthChart,
        id: (birthChart as { _id: Types.ObjectId })._id.toString(),
        bodies: natalBodies.map(body => this.bodyPositionToCelestialBody(body)),
        houses: {
          system: birthChart.houses.system,
          cusps: birthChart.houses.cusps
        }
      };

      // Calculate transits
      const transits = await this.calculateTransits(compatibleBirthChart, date);
      const windows = await this.findTransitWindows(compatibleBirthChart, date);
      const significantEvents = await this.findSignificantEvents(date);
      const houseActivations = this.calculateHouseActivations(compatibleBirthChart, transits);

      // Create analysis
      const analysis: TransitAnalysis = {
        birthChartId,
        userId: birthChart.userId.toString(),
        date,
        transits,
        windows,
        significantEvents,
        overallStrength: this.calculateOverallStrength(transits, houseActivations),
        summary: this.generateSummary(transits, windows, significantEvents, houseActivations),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Cache the result
      await this.cache.set(cacheKey, analysis);
      return analysis;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Transit analysis error:', error);
      throw new ValidationError(`Failed to analyze transits: ${error.message}`);
    }
  }

  private isValidDate(date: DateTime): boolean {
    return (
      date.year >= 1900 &&
      date.year <= 2100 &&
      date.month >= 1 &&
      date.month <= 12 &&
      date.day >= 1 &&
      date.day <= 31 &&
      date.hour >= 0 &&
      date.hour <= 23 &&
      date.minute >= 0 &&
      date.minute <= 59 &&
      date.second >= 0 &&
      date.second <= 59
    );
  }

  private generateCacheKey(birthChartId: string, date: DateTime): string {
    return `transit:${birthChartId}:${date.year}-${date.month}-${date.day}`;
  }

  private async calculateTransits(birthChart: BirthChartModel, transitDate: DateTime): Promise<TransitAspect[]> {
    try {
      // Convert DateTime to Date for calculator
      const date = new Date(
        transitDate.year,
        transitDate.month - 1,
        transitDate.day,
        transitDate.hour,
        transitDate.minute,
        transitDate.second
      );

      // Get transit positions
      const transitBodies = await this.ephemerisCalculator.calculateBodies(date);
      const transitPositions = transitBodies.map(body => 
        celestialBodyToBodyPosition(body, this.getHouseForLongitude(body.longitude, birthChart.houses))
      );

      const transits: TransitAspect[] = [];

      // Compare natal and transit positions
      for (const natalBody of birthChart.bodies) {
        for (const transitBody of transitPositions) {
          if (Number(natalBody.id) === transitBody.bodyId) continue;

          const aspect = this.calculateAspect(natalBody, transitBody);
          if (aspect) {
            transits.push({
              natalPlanet: natalBody.id.toString(),
              transitPlanet: transitBody.bodyId.toString(),
              aspectType: aspect.type,
              angle: aspect.angle,
              orb: aspect.orb,
              isApplying: this.isApplying(natalBody, transitBody),
              strength: this.calculateAspectStrength(natalBody, transitBody, aspect)
            });
          }
        }
      }

      return transits;
    } catch (error) {
      console.error('Error calculating transits:', error);
      throw new CalculationError('Failed to calculate transits');
    }
  }

  private calculateAspect(natalBody: CelestialBody, transitBody: IBodyPosition): TransitAspectCalculation | null {
    const angle = Math.abs(natalBody.longitude - transitBody.longitude);
    
    // Check for all aspects
    for (const [type, orb] of Object.entries(this.ASPECT_ORBS)) {
      const aspectAngle = this.ASPECT_ANGLES[type as keyof typeof this.ASPECT_ANGLES];
      if (Math.abs(angle - aspectAngle) <= orb) {
        return { 
          type, 
          angle, 
          orb, 
          isApplying: this.isApplying(natalBody, transitBody) 
        };
      }
    }

    return null;
  }

  private isApplying(body1: CelestialBody, body2: IBodyPosition): boolean {
    return body2.speed > body1.speed;
  }

  private calculateAspectStrength(
    natalBody: CelestialBody,
    transitBody: IBodyPosition,
    aspect: TransitAspectCalculation
  ): 'high' | 'medium' | 'low' {
    // Base strength on orb
    const orbStrength = 1 - (aspect.orb / this.ASPECT_ORBS[aspect.type as keyof typeof this.ASPECT_ORBS]);
    
    // Consider speed difference
    const speedDiff = Math.abs(transitBody.speed - natalBody.speed);
    const speedStrength = speedDiff < 1 ? 1 : speedDiff < 2 ? 0.7 : 0.4;
    
    // Calculate total strength
    const totalStrength = orbStrength * speedStrength;
    
    // Return strength level
    if (totalStrength > 0.8) return 'high';
    if (totalStrength > 0.5) return 'medium';
    return 'low';
  }

  private calculateHouseActivations(birthChart: BirthChartModel, transits: TransitAspect[]): HouseActivation[] {
    const activations: Record<number, { activatedBy: string[]; strength: number }> = {};

    // Initialize all houses
    for (let i = 1; i <= 12; i++) {
      activations[i] = { activatedBy: [], strength: 0 };
    }

    // Track house activations from transits
    for (const transit of transits) {
      const natalPlanet = birthChart.bodies.find((b: CelestialBody) => b.id.toString() === transit.natalPlanet);
      if (natalPlanet) {
        const house = this.getHouseForLongitude(natalPlanet.longitude, birthChart.houses);
        activations[house].activatedBy.push(transit.transitPlanet);
        activations[house].strength += this.getTransitStrength(transit.strength);
      }
    }

    // Convert to array format
    return Object.entries(activations).map(([house, data]) => ({
      house: parseInt(house),
      activatedBy: data.activatedBy,
      strength: this.getStrengthLevel(data.strength)
    }));
  }

  private getTransitStrength(strength: 'high' | 'medium' | 'low'): number {
    switch (strength) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private getStrengthLevel(strength: number): 'high' | 'medium' | 'low' {
    if (strength >= 6) return 'high';
    if (strength >= 3) return 'medium';
    return 'low';
  }

  private calculateOverallStrength(transits: TransitAspect[], houseActivations: HouseActivation[]): 'high' | 'medium' | 'low' {
    let totalStrength = 0;

    // Add transit strengths
    for (const transit of transits) {
      totalStrength += this.getTransitStrength(transit.strength);
    }

    // Add house activation strengths
    for (const activation of houseActivations) {
      totalStrength += this.getTransitStrength(activation.strength);
    }

    return this.getStrengthLevel(totalStrength);
  }

  private generateSummary(
    transits: TransitAspect[],
    windows: TransitWindow[],
    events: SignificantEvent[],
    houseActivations: HouseActivation[]
  ): string {
    const significantTransits = transits.filter(t => t.strength === 'high');
    const activeHouses = houseActivations.filter(h => h.strength === 'high');

    let summary = 'Current transit analysis:\n\n';
    
    if (significantTransits.length > 0) {
      summary += 'Significant transits:\n';
      for (const transit of significantTransits) {
        summary += `- ${this.getPlanetName(transit.transitPlanet)} ${transit.aspectType} ${this.getPlanetName(transit.natalPlanet)}\n`;
      }
    }

    if (activeHouses.length > 0) {
      summary += '\nActivated houses:\n';
      for (const house of activeHouses) {
        summary += `- House ${house.house} activated by ${house.activatedBy.join(', ')}\n`;
      }
    }

    if (events.length > 0) {
      summary += '\nSignificant events:\n';
      for (const event of events) {
        summary += `- ${event.description}\n`;
      }
    }

    return summary;
  }

  private getPlanetName(planetId: string): string {
    const planetNames: Record<string, string> = {
      '0': 'Sun',
      '1': 'Moon',
      '2': 'Mercury',
      '3': 'Venus',
      '4': 'Mars',
      '5': 'Jupiter',
      '6': 'Saturn',
      '7': 'Uranus',
      '8': 'Neptune',
      '9': 'Pluto'
    };
    return planetNames[planetId] || `Planet ${planetId}`;
  }

  private async findTransitWindows(birthChart: BirthChartModel, date: DateTime): Promise<TransitWindow[]> {
    const windows: TransitWindow[] = [];
    const calculator = EphemerisCalculatorSingleton.getInstance();

    // Convert DateTime to Date for calculator
    const dateObj = new Date(
      date.year,
      date.month - 1,
      date.day,
      date.hour,
      date.minute,
      date.second
    );

    // Look ahead 30 days for transit windows
    for (let i = 0; i < 30; i++) {
      const futureDate = this.addDays(date, i);
      const transits = await this.calculateTransits(birthChart, futureDate);

      for (const transit of transits) {
        if (transit.strength === 'high') {
          windows.push({
            startDate: futureDate,
            endDate: this.addDays(futureDate, 3), // Transit window lasts 3 days
            transitPlanet: transit.transitPlanet,
            aspectType: transit.aspectType,
            natalPlanet: transit.natalPlanet,
            strength: transit.strength,
            description: this.generateTransitDescription(transit),
            impact: this.generateTransitImpact(transit),
            recommendations: this.generateTransitRecommendations(transit)
          });
        }
      }
    }

    return windows;
  }

  private generateTransitDescription(transit: TransitAspect): string {
    const planetNames: { [key: string]: string } = {
      '0': 'Sun',
      '1': 'Moon',
      '2': 'Mercury',
      '3': 'Venus',
      '4': 'Mars',
      '5': 'Jupiter',
      '6': 'Saturn',
      '7': 'Uranus',
      '8': 'Neptune',
      '9': 'Pluto'
    };

    const transitName = planetNames[transit.transitPlanet] || `Planet ${transit.transitPlanet}`;
    const natalName = planetNames[transit.natalPlanet] || `Planet ${transit.natalPlanet}`;

    return `${transitName} ${transit.aspectType} ${natalName}`;
  }

  private generateTransitImpact(transit: TransitAspect): string {
    // This would be expanded with more detailed impact descriptions
    return `This transit brings significant changes and opportunities.`;
  }

  private generateTransitRecommendations(transit: TransitAspect): string[] {
    // This would be expanded with more specific recommendations
    return [
      'Pay attention to new opportunities',
      'Be mindful of potential challenges',
      'Stay open to change'
    ];
  }

  private async findSignificantEvents(date: DateTime): Promise<SignificantEvent[]> {
    const events: SignificantEvent[] = [];
    const calculator = EphemerisCalculatorSingleton.getInstance();

    // Convert DateTime to Date for calculator
    const dateObj = new Date(
      date.year,
      date.month - 1,
      date.day,
      date.hour,
      date.minute,
      date.second
    );

    // Calculate current positions
    const currentPositions = await calculator.calculateBodies(dateObj);

    // Check for retrograde planets
    for (const body of currentPositions) {
      if (body.isRetrograde) {
        events.push({
          type: 'retrograde',
          planet: body.id.toString(),
          date,
          description: `${this.getPlanetName(body.id.toString())} is retrograde`,
          strength: 'high'
        });
      }
    }

    return events;
  }

  async getTransitsByDateRange(
    birthChartId: string,
    startDate: DateTime,
    endDate: DateTime
  ): Promise<TransitAnalysis[]> {
    const analyses: TransitAnalysis[] = [];
    let currentDate = { ...startDate };

    while (this.isDateBefore(currentDate, endDate)) {
      analyses.push(await this.analyzeTransits(birthChartId, currentDate));
      currentDate = this.addDays(currentDate, 1);
    }

    return analyses;
  }

  private isDateBefore(date1: DateTime, date2: DateTime): boolean {
    const d1 = new Date(date1.year, date1.month - 1, date1.day);
    const d2 = new Date(date2.year, date2.month - 1, date2.day);
    return d1 < d2;
  }

  private addDays(date: DateTime, days: number): DateTime {
    const d = new Date(date.year, date.month - 1, date.day);
    d.setDate(d.getDate() + days);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: date.hour,
      minute: date.minute,
      second: date.second,
      timezone: date.timezone
    };
  }

  private createDate(datetime: DateTime): Date {
    return new Date(
      datetime.year,
      datetime.month - 1,
      datetime.day,
      datetime.hour,
      datetime.minute,
      datetime.second
    );
  }

  private getHouseForLongitude(longitude: number, houses: HouseSystem): number {
    const houseArray = houseSystemToHouses(houses);
    for (let i = 0; i < houseArray.length; i++) {
      const house = houseArray[i];
      const nextHouse = houseArray[(i + 1) % houseArray.length];
      if (this.isLongitudeBetween(longitude, house.cusp, nextHouse.cusp)) {
        return house.number;
      }
    }
    return 1; // Default to first house if not found
  }

  private isLongitudeBetween(longitude: number, start: number, end: number): boolean {
    // Normalize angles to 0-360 range
    longitude = (longitude + 360) % 360;
    start = (start + 360) % 360;
    end = (end + 360) % 360;

    if (start <= end) {
      return longitude >= start && longitude < end;
    } else {
      // Handle case where house spans 0° (e.g., 350° to 10°)
      return longitude >= start || longitude < end;
    }
  }

  private bodyPositionToCelestialBody(position: IBodyPosition): CelestialBody {
    return {
      id: position.bodyId,
      longitude: position.longitude,
      latitude: position.latitude,
      distance: position.distance,
      speed: position.speed,
      isRetrograde: position.retrograde
    };
  }
} 