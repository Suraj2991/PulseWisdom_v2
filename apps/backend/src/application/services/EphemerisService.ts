import { DateTime, GeoPosition, BirthChart, CelestialBody, HouseSystem } from '../types/ephemeris.types';
import { TransitAspect, TransitWindow, TransitAnalysis } from '../types/transit.types';
import { KerykeionClient } from '../clients/KerykeionClient';
import { ICache } from '../infrastructure/cache/ICache';
import { IBirthChart, BirthChartModel } from '../models/BirthChart';
import { NotFoundError } from '../types/errors';

export class EphemerisService {
  private readonly client: KerykeionClient;
  private readonly cache: ICache;

  constructor(cache: ICache, baseUrl: string) {
    this.cache = cache;
    this.client = new KerykeionClient(baseUrl);
  }

  async getBirthChartById(birthChartId: string): Promise<IBirthChart | null> {
    const cacheKey = `birth_chart:${birthChartId}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<IBirthChart>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const birthChart = await BirthChartModel.findById(birthChartId);
    if (!birthChart) {
      throw new NotFoundError('Birth chart not found');
    }

    // Cache the result
    await this.cache.set(cacheKey, birthChart, 3600); // Cache for 1 hour
    
    return birthChart;
  }

  async getBirthChartsByUserId(userId: string): Promise<IBirthChart[]> {
    const cacheKey = `birth_charts:${userId}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<IBirthChart[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const birthCharts = await BirthChartModel.find({ userId });
    
    // Cache the result
    await this.cache.set(cacheKey, birthCharts, 3600); // Cache for 1 hour
    
    return birthCharts;
  }

  async calculateBirthChart(datetime: DateTime, location: GeoPosition, houseSystem: HouseSystem = HouseSystem.PLACIDUS): Promise<BirthChart> {
    const cacheKey = `birth_chart:${JSON.stringify({ datetime, location, houseSystem })}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<BirthChart>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate if not in cache
    const birthChart = await this.client.calculateBirthChart(datetime, location, houseSystem);
    
    // Cache the result
    await this.cache.set(cacheKey, birthChart, 3600); // Cache for 1 hour
    
    return birthChart;
  }

  async analyzeTransits(birthChartId: string, date: DateTime): Promise<TransitAnalysis> {
    const birthChart = await this.getBirthChartById(birthChartId);
    if (!birthChart) {
      throw new NotFoundError('Birth chart not found');
    }

    const calculatedBirthChart = await this.calculateBirthChart(
      birthChart.datetime,
      birthChart.location,
      birthChart.houseSystem
    );

    return this.calculateTransits(calculatedBirthChart, date);
  }

  async calculateTransits(birthChart: BirthChart, date: DateTime): Promise<TransitAnalysis> {
    const cacheKey = `transits:${JSON.stringify({ birthChartId: birthChart.datetime, date })}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<TransitAnalysis>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate if not in cache
    const transits = await this.client.calculateTransits(birthChart, date);
    const windows = await this.client.calculateTransitWindows(birthChart, date);
    
    const analysis: TransitAnalysis = {
      date,
      transits,
      windows
    };
    
    // Cache the result
    await this.cache.set(cacheKey, analysis, 3600); // Cache for 1 hour
    
    return analysis;
  }

  async calculatePlanetaryPositions(date: DateTime): Promise<CelestialBody[]> {
    const cacheKey = `positions:${JSON.stringify(date)}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<CelestialBody[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate if not in cache
    const positions = await this.client.calculatePlanetaryPositions(date);
    
    // Cache the result
    await this.cache.set(cacheKey, positions, 3600); // Cache for 1 hour
    
    return positions;
  }

  async calculateLunarPhases(startDate: DateTime, endDate: DateTime): Promise<any[]> {
    const cacheKey = `lunar_phases:${JSON.stringify({ startDate, endDate })}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate if not in cache
    const phases = await this.client.calculateLunarPhases(startDate, endDate);
    
    // Cache the result
    await this.cache.set(cacheKey, phases, 3600); // Cache for 1 hour
    
    return phases;
  }

  async calculateFixedStars(date: DateTime): Promise<any[]> {
    const cacheKey = `fixed_stars:${JSON.stringify(date)}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate if not in cache
    const stars = await this.client.calculateFixedStars(date);
    
    // Cache the result
    await this.cache.set(cacheKey, stars, 3600); // Cache for 1 hour
    
    return stars;
  }

  async calculateSignificantEvents(startDate: DateTime, endDate: DateTime): Promise<any[]> {
    const cacheKey = `significant_events:${JSON.stringify({ startDate, endDate })}`;
    
    // Try to get from cache first
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate if not in cache
    const events = await this.client.calculateSignificantEvents(startDate, endDate);
    
    // Cache the result
    await this.cache.set(cacheKey, events, 3600); // Cache for 1 hour
    
    return events;
  }

  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }
} 