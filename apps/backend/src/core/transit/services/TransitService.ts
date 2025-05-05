import { BaseEphemerisService
  , IEphemerisClient
  , CelestialPosition
  , AspectResponse
  , BirthChart
  , DateTime
  , CelestialBody
  , GeoPosition 
  , CelestialBodyService
  , AspectService
  , HouseService
  , EphemerisErrorHandler } from '../../ephemeris';
import { TransitAnalysis
  , TransitWindow
  , Transit
  , TransitCacheManager
  , TransitClassifier
  , WindowType } from '../../transit';
import { BirthChartService, IBirthChart } from '../../birthchart';
import { getSignFromLongitude } from '../../insight';
import { ICache } from '../../../infrastructure/cache/ICache';
import { NotFoundError, ServiceError } from '../../../domain/errors';
import { logger } from '../../../shared/logger';
import { TRANSIT_WINDOW_DURATION, AspectType, ZodiacSign } from '../../../shared/constants/astrology';
import { adaptBirthChartData } from '../../birthchart/adapters/BirthChart.adapters';

import { ObjectId } from 'mongodb';


export class TransitService extends BaseEphemerisService {
  private readonly cacheManager: TransitCacheManager;
  protected readonly aspectService: AspectService;

  constructor(
    protected readonly ephemerisClient: IEphemerisClient,
    protected readonly cache: ICache,
    private readonly birthChartService: BirthChartService,
    protected readonly celestialBodyService: CelestialBodyService,
    aspectService: AspectService,
    protected readonly houseService: HouseService,
    protected readonly errorHandler: EphemerisErrorHandler,
  ) {
    super(
      ephemerisClient,
      cache,
      celestialBodyService,
      aspectService,
      houseService,
      errorHandler
    );
    this.cacheManager = new TransitCacheManager(cache);
    this.aspectService = aspectService;
  }

  protected getSignFromLongitude(longitude: number): ZodiacSign {
    return getSignFromLongitude(longitude);
  }

  async analyzeTransits(birthChart: IBirthChart & { _id: ObjectId }, date: Date = new Date()): Promise<TransitAnalysis> {
    try {
      const chart = adaptBirthChartData(birthChart);
      const transits = await this.calculateTransits(chart, date);
      
      // Group transits by window type
      const groupedTransits = this.groupTransitsByWindowType(transits);
      
      // Create windows from grouped transits
      const windows = this.createWindowsFromGroupedTransits(groupedTransits);
      
      // Sort windows by significance
      windows.sort((a, b) => b.significance - a.significance);
      
      const flattenedTransits = windows.flatMap(window => window.transits);
      const analysis = {
        windows,
        majorThemes: this.extractMajorThemes(flattenedTransits),
        recommendations: this.generateRecommendations(flattenedTransits)
      };

      // Cache the analysis
      await this.cacheManager.cacheTransitsForDate(date, flattenedTransits);
      
      return analysis;
    } catch (error) {
      logger.error('Error analyzing transits:', error);
      throw new ServiceError('Failed to analyze transits');
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
    const flattenedTransits = windows.flatMap(window => window.transits);
    return {
      windows,
      majorThemes: this.extractMajorThemes(flattenedTransits),
      recommendations: this.generateRecommendations(flattenedTransits)
    };
  }

  private async cacheTransitAnalysis(cacheKey: string, analysis: TransitAnalysis): Promise<void> {
    await this.cacheManager.cacheTransitsForDate(new Date(cacheKey), analysis.windows.flatMap(w => w.transits));
  }

  private async getCachedTransitAnalysis(cacheKey: string): Promise<TransitAnalysis | null> {
    const transits = await this.cacheManager.getTransitsForDate(new Date(cacheKey));
    if (!transits) return null;
    
    const groupedTransits = this.groupTransitsByWindowType(transits);
    const windows = this.createWindowsFromGroupedTransits(groupedTransits);
    return {
      windows,
      majorThemes: this.extractMajorThemes(transits),
      recommendations: this.generateRecommendations(transits)
    };
  }

  private async calculateTransits(birthChart: BirthChart, currentDate: Date): Promise<Transit[]> {
    try {
      // Try to get cached transits first
      const cachedTransits = await this.cacheManager.getTransitsForDate(currentDate);
      if (cachedTransits) {
        logger.info('Retrieved transits from cache', { date: currentDate.toISOString() });
        return cachedTransits;
      }

      // If no cached data, calculate transits
      const location: GeoPosition = birthChart.location;
      const dateTime: DateTime = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
        hour: currentDate.getHours(),
        minute: currentDate.getMinutes()
      };

      const positions = await this.getPlanetaryPositionsForDate(dateTime, location);
      const formattedPositions = this.formatPlanetaryPositions(positions);
      const transits = await this.findRelevantTransits(birthChart, formattedPositions, dateTime);

      // Cache the calculated transits
      await this.cacheManager.cacheTransitsForDate(currentDate, transits);
      logger.info('Cached calculated transits', { date: currentDate.toISOString() });

      return transits;
    } catch (error) {
      logger.error('Error calculating transits:', error);
      throw new ServiceError('Failed to calculate transits');
    }
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
        const transit = this.createTransitFromAspect(aspect, natalBody, positions, birthChart, date);
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
    return this.ephemerisClient.calculateAspects([
      ...Object.entries(positions).map(([name, pos]) => ({
        id: 0,
        name,
        longitude: pos.longitude,
        latitude: pos.latitude,
        speed: pos.speed,
        house: 1, // Default to house 1 since it's optional in CelestialPosition
        sign: this.getSignFromLongitude(pos.longitude),
        retrograde: pos.speed < 0
      }))
    ]);
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

  private validateAspectType(aspectType: string): AspectType {
    const validTypes = ['conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx', 'semiSquare', 'sesquisquare'];
    if (!validTypes.includes(aspectType)) {
      throw new Error(`Invalid aspect type: ${aspectType}`);
    }
    return aspectType as AspectType;
  }

  private calculateStrength(strength: 'high' | 'medium' | 'low', orb: number): number {
    const baseStrength = {
      high: 0.8,
      medium: 0.5,
      low: 0.3
    }[strength];
    return baseStrength * (1 - orb / 10);
  }

  private createTransitFromAspect(
    aspect: AspectResponse,
    natalBody: CelestialBody,
    positions: Record<string, CelestialPosition>,
    birthChart: BirthChart,
    date: DateTime
  ): Transit | null {
    const transitBodyName = aspect.body1 === natalBody.name ? aspect.body2 : aspect.body1;
    const transitPosition = positions[transitBodyName.toLowerCase()];
    if (!transitPosition) return null;

    // Basic orb validation
    if (aspect.orb < 0 || aspect.orb > 10) {
      logger.warn('Invalid orb value detected', { orb: aspect.orb, transitBodyName });
      return null;
    }

    const validatedAspectType = this.validateAspectType(aspect.aspectType);
    const strength = this.aspectService.calculateAspectStrength(
      this.convertToDomainCelestialBody(transitPosition, transitBodyName),
      natalBody,
      validatedAspectType,
      aspect.orb
    );

    if (strength === 'high' && aspect.orb <= 1) {
      const houseNum = this.calculateHouse(transitPosition.longitude, birthChart.houses.cusps);
      const windowType = TransitClassifier.getWindowType(
        validatedAspectType,
        aspect.orb,
        transitBodyName,
        houseNum
      );

      return {
        planet: transitBodyName,
        sign: this.getSignFromLongitude(transitPosition.longitude),
        house: houseNum,
        orb: aspect.orb,
        aspectingNatal: natalBody,
        exactDate: new Date(date.year, date.month - 1, date.day),
        type: validatedAspectType,
        influence: this.generateTransitInfluence(transitBodyName, natalBody.name, validatedAspectType),
        strength: this.calculateStrength(strength, aspect.orb),
        windowType,
        isRetrograde: transitPosition.speed < 0
      };
    }
    return null;
  }

  private createTransitWindow(date: DateTime, transits: Transit[]): TransitWindow {
    return {
      type: this.determineWindowType(transits[0]),
      title: this.generateWindowTitle(transits[0]),
      startDate: new Date(date.year, date.month - 1, date.day),
      endDate: new Date(date.year, date.month - 1, date.day + TRANSIT_WINDOW_DURATION),
      transits,
      significance: this.calculateWindowSignificance(transits[0]),
      description: this.generateTransitDescription(transits[0]),
      involvedPlanets: this.getInvolvedPlanets(transits),
      aspectType: this.getAspectType(transits[0]),
      keywords: this.generateKeywords(transits[0])
    };
  }

  private getInvolvedPlanets(transits: Transit[]): string[] {
    const planets = new Set<string>();
    transits.forEach(transit => {
      planets.add(transit.planet);
      if (transit.aspectingNatal) {
        planets.add(transit.aspectingNatal.name);
      }
    });
    return Array.from(planets);
  }

  private getAspectType(transit: Transit): string {
    return transit.type;
  }

  private generateKeywords(transit: Transit): string[] {
    const keywords = new Set<string>();
    
    // Add type-based keywords
    const type = this.determineWindowType(transit);
    keywords.add(type.toLowerCase());
    
    // Add planet-based keywords
    keywords.add(transit.planet.toLowerCase());
    
    // Add sign-based keywords
    keywords.add(transit.sign.toLowerCase());
    
    // Add aspect-based keywords
    keywords.add(transit.type.toLowerCase());
    
    // Add house-based keywords if available
    if (transit.house) {
      keywords.add(`house${transit.house}`);
    }
    
    // Add retrograde keyword if applicable
    if (transit.isRetrograde) {
      keywords.add('retrograde');
    }
    
    return Array.from(keywords);
  }

  private determineWindowType(transit: Transit): WindowType {
    return transit.windowType;
  }

  protected getCelestialPositionByName(positions: Record<string, CelestialPosition>, name: string): CelestialPosition | null {
    return positions[name] || null;
  }

  async getPlanetaryPositions(date: DateTime, latitude: number, longitude: number): Promise<CelestialBody[]> {
    return this.calculatePositions(date, { latitude, longitude });
  }

  protected convertToDomainCelestialBody(position: CelestialPosition, name: string): CelestialBody {
    return {
      id: 0,
      name,
      longitude: position.longitude,
      latitude: position.latitude,
      speed: position.speed,
      house: 1, // Default to house 1 since it's optional in CelestialPosition
      sign: this.getSignFromLongitude(position.longitude),
      retrograde: position.speed < 0
    };
  }

  private calculateWindowSignificance(transit: Partial<Transit>): number {
    let significance = 0.5; // Base significance
    
    // Adjust based on aspect type
    if (transit.type) {
      const aspectType = transit.type as AspectType;
      if (TransitClassifier.isChallengingAspect(aspectType)) {
        significance += 0.2;
      } else if (TransitClassifier.isHarmoniousAspect(aspectType)) {
        significance += 0.1;
      }
    }
    
    // Adjust based on planet type
    if (transit.planet) {
      if (TransitClassifier.isTransformativePlanet(transit.planet)) {
        significance += 0.2;
      } else if (TransitClassifier.isPersonalPlanet(transit.planet)) {
        significance += 0.1;
      }
    }
    
    // Adjust based on house placement
    if (transit.house) {
      if (TransitClassifier.isChallengingHouse(transit.house)) {
        significance += 0.1;
      } else if (TransitClassifier.isHarmoniousHouse(transit.house)) {
        significance += 0.1;
      }
    }
    
    // Adjust based on orb
    if (transit.orb) {
      if (transit.orb <= 1) {
        significance += 0.2;
      } else if (transit.orb <= 3) {
        significance += 0.1;
      }
    }

    // Adjust based on retrograde status
    if (transit.isRetrograde) {
      significance += 0.1;
    }
    
    return Math.min(significance, 1.0); // Cap at 1.0
  }

  private generateTransitDescription(transit: Transit): string {
    return `${transit.planet} is transiting through ${transit.sign}`;
  }

  private generateTransitInfluence(transitPlanet: string, natalPlanet: string, aspectType: string): string {
    return `${transitPlanet} ${aspectType} ${natalPlanet} influences personal growth and transformation`;
  }

  private extractMajorThemes(transits: Transit[]): string[] {
    const themes = new Set<string>();
    
    // Group by window type
    const byWindowType = new Map<WindowType, Transit[]>();
    transits.forEach(transit => {
      const transitList = byWindowType.get(transit.windowType) || [];
      byWindowType.set(transit.windowType, transitList);
      transitList.push(transit);
    });
    
    // Generate themes for each window type
    byWindowType.forEach((windowTransits, type) => {
      const planets = [...new Set(windowTransits.map(t => t.planet))];
      const aspects = [...new Set(windowTransits.map(t => t.influence))];
      
      switch (type) {
        case WindowType.Opportunity:
          themes.add(`Favorable ${planets.join(', ')} influences creating ${aspects.join(', ')} aspects`);
          break;
        case WindowType.Challenge:
          themes.add(`Challenging ${planets.join(', ')} aspects requiring attention`);
          break;
        case WindowType.Integration:
          themes.add(`Transformative ${planets.join(', ')} aspects for growth`);
          break;
      }
    });
    
    return Array.from(themes);
  }

  private generateRecommendations(transits: Transit[]): string[] {
    const recommendations = new Set<string>();
    
    transits.forEach(transit => {
      switch (transit.windowType) {
        case WindowType.Opportunity:
          recommendations.add(`Take advantage of ${transit.planet}'s favorable influence in ${transit.sign}`);
          break;
        case WindowType.Challenge:
          recommendations.add(`Be mindful of ${transit.planet}'s challenging aspect to ${transit.aspectingNatal?.name}`);
          break;
        case WindowType.Integration:
          recommendations.add(`Reflect on ${transit.planet}'s transformative influence in house ${transit.house}`);
          break;
      }
    });
    
    return Array.from(recommendations);
  }

  protected calculateHouse(longitude: number, cusps: number[]): number {
    for (let i = 0; i < cusps.length; i++) {
      const nextIndex = (i + 1) % cusps.length;
      if (longitude >= cusps[i] && longitude < cusps[nextIndex]) {
        return i + 1;
      }
    }
    return 1; // Default to first house if not found
  }

  private groupTransitsByWindowType(transits: Transit[]): Map<WindowType, Transit[]> {
    const grouped = new Map<WindowType, Transit[]>();
    
    transits.forEach(transit => {
      const type = transit.windowType;
      const transitList = grouped.get(type) || [];
      grouped.set(type, transitList);
      transitList.push(transit);
    });
    
    return grouped;
  }

  private createWindowsFromGroupedTransits(groupedTransits: Map<WindowType, Transit[]>): TransitWindow[] {
    const windows: TransitWindow[] = [];
    
    groupedTransits.forEach((transits, windowType) => {
      if (transits.length > 0) {
        const startDate = new Date(Math.min(...transits.map(t => t.exactDate.getTime())));
        const endDate = new Date(Math.max(...transits.map(t => t.exactDate.getTime())));
        
        // Add buffer days to the window
        endDate.setDate(endDate.getDate() + TRANSIT_WINDOW_DURATION);
        
        const window: TransitWindow = {
          type: this.determineWindowType(transits[0]),
          title: this.generateWindowTitle(transits[0]),
          startDate,
          endDate,
          transits,
          significance: this.calculateWindowSignificance(transits[0]),
          description: this.generateWindowDescription(transits, windowType),
          involvedPlanets: this.getInvolvedPlanets(transits),
          aspectType: this.getAspectType(transits[0]),
          keywords: this.generateKeywords(transits[0])
        };
        windows.push(window);
      }
    });
    
    return windows;
  }

  private generateWindowTitle(transit: Transit): string {
    const type = this.determineWindowType(transit);
    const planet = transit.planet;
    const sign = transit.sign;
    
    switch (type) {
      case WindowType.Opportunity:
        return `${planet} in ${sign}: Favorable Period`;
      case WindowType.Challenge:
        return `${planet} in ${sign}: Growth Opportunity`;
      case WindowType.Integration:
        return `${planet} in ${sign}: Transformative Period`;
      default:
        return `${planet} Transit in ${sign}`;
    }
  }

  private generateWindowDescription(transits: Transit[], windowType: WindowType): string {
    const planetNames = [...new Set(transits.map(t => t.planet))];
    const aspectTypes = [...new Set(transits.map(t => t.influence))];
    
    switch (windowType) {
      case WindowType.Opportunity:
        return `Favorable period for ${planetNames.join(', ')} influences with ${aspectTypes.join(', ')} aspects`;
      case WindowType.Challenge:
        return `Challenging period with ${planetNames.join(', ')} creating ${aspectTypes.join(', ')} aspects`;
      case WindowType.Integration:
        return `Transformative period as ${planetNames.join(', ')} form ${aspectTypes.join(', ')} aspects`;
      default:
        return 'Significant transit period';
    }
  }

  private async getTransitsForDate(birthChart: BirthChart, date: Date): Promise<Transit[]> {
    try {
      const transits = await this.calculateTransits(birthChart, date);
      return transits.map(transit => {
        const transitObj: Transit = {
          planet: transit.planet,
          sign: transit.sign,
          house: transit.house,
          orb: transit.orb,
          exactDate: transit.exactDate,
          aspectingNatal: transit.aspectingNatal,
          type: transit.type as AspectType,
          isRetrograde: transit.isRetrograde,
          influence: transit.influence || 'neutral',
          strength: transit.strength || 0.5,
          windowType: transit.windowType
        };
        return transitObj;
      });
    } catch (error) {
      logger.error('Error getting transits for date:', error);
      throw new ServiceError('Failed to get transits for date');
    }
  }

  private createTransitObject(data: Partial<Transit>): Transit {
    return {
      planet: data.planet || '',
      sign: data.sign || '',
      house: data.house,
      orb: data.orb,
      exactDate: data.exactDate || new Date(),
      aspectingNatal: data.aspectingNatal,
      type: data.type || 'conjunction' as AspectType,
      isRetrograde: data.isRetrograde || false,
      influence: data.influence || 'neutral',
      strength: data.strength || 0.5,
      windowType: data.windowType || WindowType.Integration
    };
  }
} 