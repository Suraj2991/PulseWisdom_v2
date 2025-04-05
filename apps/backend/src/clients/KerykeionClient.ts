import { DateTime, GeoPosition, BirthChart, CelestialBody, HouseSystem } from '../types/ephemeris.types';
import { TransitAspect, TransitWindow, TransitAnalysis } from '../types/transit.types';
import axios, { AxiosInstance } from 'axios';

export class KerykeionClient {
  private readonly client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async calculateBirthChart(datetime: DateTime, location: GeoPosition, houseSystem: HouseSystem): Promise<BirthChart> {
    const response = await this.client.post('/birth-chart', {
      datetime,
      location,
      houseSystem
    });
    return response.data;
  }

  async calculateTransits(birthChart: BirthChart, date: DateTime): Promise<TransitAspect[]> {
    const response = await this.client.post('/transits', {
      birthChart,
      date
    });
    return response.data;
  }

  async calculateTransitWindows(birthChart: BirthChart, date: DateTime): Promise<TransitWindow[]> {
    const response = await this.client.post('/transit-windows', {
      birthChart,
      date
    });
    return response.data;
  }

  async calculatePlanetaryPositions(date: DateTime): Promise<CelestialBody[]> {
    const response = await this.client.post('/positions', {
      date
    });
    return response.data;
  }

  async calculateLunarPhases(startDate: DateTime, endDate: DateTime): Promise<any[]> {
    const response = await this.client.post('/lunar-phases', {
      startDate,
      endDate
    });
    return response.data;
  }

  async calculateFixedStars(date: DateTime): Promise<any[]> {
    const response = await this.client.post('/fixed-stars', {
      date
    });
    return response.data;
  }

  async calculateSignificantEvents(startDate: DateTime, endDate: DateTime): Promise<any[]> {
    const response = await this.client.post('/significant-events', {
      startDate,
      endDate
    });
    return response.data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
} 