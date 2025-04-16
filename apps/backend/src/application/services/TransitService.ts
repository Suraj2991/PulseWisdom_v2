import { BaseEphemerisService } from './BaseEphemerisService';
import { IEphemerisClient, CelestialBody as EphemerisCelestialBody, CelestialPosition, AspectResponse } from '../../domain/ports/IEphemerisClient';
import { BirthChart, DateTime, CelestialBody, GeoPosition } from '../../domain/types/ephemeris.types';
import { TransitAnalysis, TransitWindow, Transit } from '../../domain/types/transit.types';
import { ICache } from '../../infrastructure/cache/ICache';
import { CacheKeyGenerator } from '../../shared/utils/cacheKeys';
import { ValidationUtils } from '../../shared/utils/validation';
import { AppError, NotFoundError } from '../../domain/errors';
import { logger } from '../../shared/logger';
import { TRANSIT_WINDOW_DAYS, TRANSIT_WINDOW_DURATION, AspectType, ZodiacSign } from '../../shared/constants/astrology';
import { CelestialBodyService } from './ephemeris/CelestialBodyService';
import { AspectService } from './ephemeris/AspectService';
import { HouseService } from './ephemeris/HouseService';
import { EphemerisErrorHandler } from './ephemeris/EphemerisErrorHandler';
import { BirthChartService } from './BirthChartService';
import { IBirthChart } from '../../domain/models/BirthChart';

export class TransitService extends BaseEphemerisService {
  constructor(
    protected readonly ephemerisClient: IEphemerisClient,
    protected readonly cache: ICache,
    private readonly birthChartService: BirthChartService,
    protected readonly celestialBodyService: CelestialBodyService,
    protected readonly aspectService: AspectService,
    protected readonly houseService: HouseService,
    protected readonly errorHandler: EphemerisErrorHandler
  ) {
    super(
      ephemerisClient,
      cache,
      celestialBodyService,
      aspectService,
      houseService,
      errorHandler
    );
  }

  private convertToBirthChart(birthChart: IBirthChart): BirthChart {
    const sun = birthChart.bodies.find(b => b.name === 'Sun');
    const moon = birthChart.bodies.find(b => b.name === 'Moon');
    const ascendant = birthChart.angles.ascendant;

    return {
      datetime: birthChart.datetime,
      location: birthChart.location,
      bodies: birthChart.bodies,
      houses: birthChart.houses,
      aspects: birthChart.aspects.map(aspect => ({
        ...aspect,
        isApplying: true // Default to true as we don't have this info in IBirthChart
      })),
      angles: {
        ascendant: birthChart.angles.ascendant,
        midheaven: birthChart.angles.mc,
        descendant: birthChart.angles.descendant,
        imumCoeli: birthChart.angles.ic
      },
      sun: sun?.sign || '',
      moon: moon?.sign || '',
      ascendant,
      planets: birthChart.bodies.map(body => ({
        name: body.name,
        sign: body.sign,
        house: body.house,
        degree: body.signLongitude
      })),
      housePlacements: birthChart.houses.cusps.map((cusp, index) => ({
        house: index + 1,
        sign: this.getSignFromLongitude(cusp)
      })),
      chiron: {
        sign: birthChart.bodies.find(b => b.name === 'Chiron')?.sign || '',
        house: birthChart.bodies.find(b => b.name === 'Chiron')?.house || 0,
        degree: birthChart.bodies.find(b => b.name === 'Chiron')?.signLongitude || 0
      },
      northNode: {
        sign: birthChart.bodies.find(b => b.name === 'North Node')?.sign || '',
        house: birthChart.bodies.find(b => b.name === 'North Node')?.house || 0,
        degree: birthChart.bodies.find(b => b.name === 'North Node')?.signLongitude || 0
      },
      southNode: {
        sign: birthChart.bodies.find(b => b.name === 'South Node')?.sign || '',
        house: birthChart.bodies.find(b => b.name === 'South Node')?.house || 0,
        degree: birthChart.bodies.find(b => b.name === 'South Node')?.signLongitude || 0
      }
    };
  }

  protected getSignFromLongitude(longitude: number): ZodiacSign {
    const signs: ZodiacSign[] = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs[Math.floor(longitude / 30)];
  }

  async analyzeTransits(birthChartId: string, currentDate: DateTime): Promise<TransitAnalysis> {
    const cacheKey = CacheKeyGenerator.getTransitKey(birthChartId, currentDate);
    
    try {
      logger.info('Starting transit analysis', { 
        birthChartId,
        date: `${currentDate.year}-${currentDate.month}-${currentDate.day}` 
      });
      
      const cached = await this.getFromCache<TransitAnalysis>(cacheKey);
      if (cached) {
        logger.debug('Retrieved transits from cache', { birthChartId });
        return cached;
      }

      const birthChart = await this.getBirthChartForAnalysis(birthChartId);
      const convertedChart = this.convertToBirthChart(birthChart);
      const currentPositions = await this.getCurrentPlanetaryPositions(currentDate, birthChart.location);
      const windows = await this.calculateTransitWindows(convertedChart, currentDate);
      const analysis = this.createTransitAnalysis(windows);

      await this.cacheTransitAnalysis(cacheKey, analysis);
      return analysis;
    } catch (error) {
      this.logAstrologyError(error, { birthChartId, currentDate });
      throw new AppError('Failed to analyze transits: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async getBirthChartForAnalysis(birthChartId: string): Promise<IBirthChart> {
    const birthChart = await this.birthChartService.getBirthChartById(birthChartId);
    if (!birthChart) {
      logger.error('Transit analysis failed: Birth chart not found', { birthChartId });
      throw new NotFoundError('Birth chart not found');
    }
    return birthChart;
  }

  private async getCurrentPlanetaryPositions(currentDate: DateTime, location: GeoPosition): Promise<CelestialBody[]> {
    return this.getPlanetaryPositions(
      currentDate,
      location.latitude,
      location.longitude
    );
  }

  private createTransitAnalysis(windows: TransitWindow[]): TransitAnalysis {
    return {
      windows,
      majorThemes: this.extractMajorThemes(windows),
      recommendations: this.generateRecommendations(windows)
    };
  }

  private async cacheTransitAnalysis(cacheKey: string, analysis: TransitAnalysis): Promise<void> {
    await this.setInCache(cacheKey, analysis, 3600); // Cache for 1 hour
  }

  private async calculateTransitWindows(birthChart: BirthChart, startDate: DateTime): Promise<TransitWindow[]> {
    const windows: TransitWindow[] = [];

    for (let i = 0; i < TRANSIT_WINDOW_DAYS; i++) {
      const date = this.getNextDate(startDate, i);
      const positions = await this.getPlanetaryPositionsForDate(date, birthChart.location);
      const formattedPositions = this.formatPlanetaryPositions(positions);
      const transits = await this.findRelevantTransits(birthChart, formattedPositions, date);
      
      if (transits.length > 0) {
        const window = this.createTransitWindow(date, transits);
        windows.push(window);
      }
    }

    return windows;
  }

  private getNextDate(startDate: DateTime, daysToAdd: number): DateTime {
    return { ...startDate, day: startDate.day + daysToAdd };
  }

  private async getPlanetaryPositionsForDate(date: DateTime, location: GeoPosition): Promise<CelestialBody[]> {
    return this.getPlanetaryPositions(
      date,
      location.latitude,
      location.longitude
    );
  }

  private formatPlanetaryPositions(positionsArray: CelestialBody[]): Record<string, CelestialPosition> {
    const positions: Record<string, CelestialPosition> = {};
    positionsArray.forEach(pos => {
      positions[pos.name.toLowerCase()] = {
        longitude: pos.longitude,
        latitude: pos.latitude,
        speed: pos.speed,
        distance: 0,
        declination: 0,
        rightAscension: 0,
        isRetrograde: pos.speed < 0
      };
    });
    return positions;
  }

  private async findRelevantTransits(
    birthChart: BirthChart,
    positions: Record<string, CelestialPosition>,
    date: DateTime
  ): Promise<Transit[]> {
    const transits: Transit[] = [];
    
    for (const natalBody of birthChart.bodies) {
      const aspects = await this.calculateAspectsForBody(natalBody, positions);
      const relevantAspects = this.filterRelevantAspects(aspects, natalBody);
      
      for (const aspect of relevantAspects) {
        const transit = await this.createTransitFromAspect(aspect, natalBody, positions, birthChart, date);
        if (transit) {
          transits.push(transit);
        }
      }
    }
    
    return transits;
  }

  private async calculateAspectsForBody(
    natalBody: CelestialBody,
    positions: Record<string, CelestialPosition>
  ): Promise<AspectResponse[]> {
    return this.ephemerisClient.calculateAspects({
      ...positions,
      sun: positions.sun || this.getDefaultPosition(),
      moon: positions.moon || this.getDefaultPosition(),
      mercury: positions.mercury || this.getDefaultPosition(),
      venus: positions.venus || this.getDefaultPosition(),
      mars: positions.mars || this.getDefaultPosition(),
      jupiter: positions.jupiter || this.getDefaultPosition(),
      saturn: positions.saturn || this.getDefaultPosition(),
      uranus: positions.uranus || this.getDefaultPosition(),
      neptune: positions.neptune || this.getDefaultPosition(),
      pluto: positions.pluto || this.getDefaultPosition(),
      name: '',
      longitude: 0,
      latitude: 0,
      speed: 0
    });
  }

  private getDefaultPosition(): CelestialPosition {
    return {
      longitude: 0,
      latitude: 0,
      speed: 0,
      distance: 0,
      declination: 0,
      rightAscension: 0,
      isRetrograde: false
    };
  }

  private filterRelevantAspects(aspects: AspectResponse[], natalBody: CelestialBody): AspectResponse[] {
    return aspects.filter(aspect => 
      aspect.body1 === natalBody.name || aspect.body2 === natalBody.name
    );
  }

  private async createTransitFromAspect(
    aspect: AspectResponse,
    natalBody: CelestialBody,
    positions: Record<string, CelestialPosition>,
    birthChart: BirthChart,
    date: DateTime
  ): Promise<Transit | null> {
    const transitBodyName = aspect.body1 === natalBody.name ? aspect.body2 : aspect.body1;
    const transitPosition = this.getCelestialPositionByName(positions, transitBodyName);
    if (!transitPosition) return null;

    const strength = this.calculateAspectStrength(
      natalBody,
      this.convertToDomainCelestialBody(transitPosition, transitBodyName),
      aspect.aspectType as AspectType,
      aspect.orb
    );

    if (strength === 'high' && aspect.orb <= 1) {
      return {
        planet: transitBodyName,
        sign: this.getSignFromLongitude(transitPosition.longitude),
        house: this.calculateHouse(transitPosition.longitude, birthChart.houses.cusps),
        orb: aspect.orb,
        aspectingNatal: natalBody,
        exactDate: new Date(date.year, date.month - 1, date.day),
        influence: this.generateTransitInfluence(transitBodyName, natalBody.name, aspect.aspectType),
        strength: this.calculateWindowSignificance({
          planet: transitBodyName,
          sign: this.getSignFromLongitude(transitPosition.longitude),
          house: this.calculateHouse(transitPosition.longitude, birthChart.houses.cusps),
          orb: aspect.orb,
          aspectingNatal: natalBody,
          exactDate: new Date(date.year, date.month - 1, date.day),
          influence: this.generateTransitInfluence(transitBodyName, natalBody.name, aspect.aspectType),
          strength: 0.8
        })
      };
    }
    return null;
  }

  private createTransitWindow(date: DateTime, transits: Transit[]): TransitWindow {
    return {
      startDate: new Date(date.year, date.month - 1, date.day),
      endDate: new Date(date.year, date.month - 1, date.day + TRANSIT_WINDOW_DURATION),
      transits,
      significance: this.calculateWindowSignificance(transits[0]),
      description: this.generateTransitDescription(transits[0])
    };
  }

  protected getCelestialPositionByName(positions: Record<string, CelestialPosition>, name: string): CelestialPosition | null {
    return positions[name] || null;
  }

  async getPlanetaryPositions(date: DateTime, latitude: number, longitude: number): Promise<CelestialBody[]> {
    return this.calculatePositions(date, { latitude, longitude });
  }

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

  private calculateWindowSignificance(transit: Transit): number {
    // Calculate significance based on aspect type, orb, and planet strengths
    const baseSignificance = transit.strength || 0.5;
    const orbFactor = 1 - (transit.orb / 5); // Normalize orb to 0-1 range
    return baseSignificance * orbFactor;
  }

  private generateTransitDescription(transit: Transit): string {
    return `${transit.planet} in ${transit.sign} (${transit.house}th house) aspects natal ${transit.aspectingNatal?.name}`;
  }

  private generateTransitInfluence(transitPlanet: string, natalPlanet: string, aspectType: string): string {
    return `${transitPlanet} ${aspectType} ${natalPlanet} influences personal growth and transformation`;
  }

  private extractMajorThemes(windows: TransitWindow[]): string[] {
    const themes = new Set<string>();
    windows.forEach(window => {
      window.transits.forEach(transit => {
        themes.add(`${transit.planet} in ${transit.sign}`);
      });
    });
    return Array.from(themes);
  }

  private generateRecommendations(windows: TransitWindow[]): string[] {
    const recommendations = new Set<string>();
    windows.forEach(window => {
      window.transits.forEach(transit => {
        recommendations.add(`Pay attention to ${transit.planet.toLowerCase()} themes during this period`);
        recommendations.add('Use this energy constructively');
        recommendations.add('Be mindful of potential challenges');
      });
    });
    return Array.from(recommendations);
  }

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
} 