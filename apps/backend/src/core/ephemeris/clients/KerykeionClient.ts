import { DateTime, GeoPosition, BirthChart, CelestialBody } from '../types/ephemeris.types';
import { TransitWindow, TransitAspect } from '../../transit';
import axios, { AxiosInstance } from 'axios';
import { ServiceUnavailableError, CalculationError } from '../../../domain/errors';
import { IEphemerisClient, EphemerisRequest, AspectResponse, HouseResponse } from '../ports/IEphemerisClient';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/logger';

interface LunarPhase {
  date: DateTime;
  phase: string;
  illumination: number;
}

interface FixedStar {
  name: string;
  longitude: number;
  latitude: number;
  magnitude: number;
}

interface SignificantEvent {
  date: DateTime;
  type: string;
  description: string;
  bodies: string[];
}

export class KerykeionClient implements IEphemerisClient {
  private client: AxiosInstance;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.client = axios.create({
      baseURL: config.ephemerisApiUrl,
      timeout: config.ephemerisTimeoutMs,
      headers: {
        'Authorization': `Bearer ${config.ephemerisApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    logger.info('KerykeionClient initialized');
  }

  async calculatePositions(request: EphemerisRequest): Promise<CelestialBody[]> {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post('/positions', request);
        return response.data;
      } catch (error) {
        throw this.handleApiError(error);
      }
    });
  }

  async calculateAspects(positions: CelestialBody[]): Promise<AspectResponse[]> {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post('/aspects', { positions });
        return response.data;
      } catch (error) {
        throw this.handleApiError(error);
      }
    });
  }

  async calculateHouses(request: EphemerisRequest): Promise<HouseResponse[]> {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post('/houses', request);
        return response.data;
      } catch (error) {
        throw this.handleApiError(error);
      }
    });
  }

  async calculateBirthChart(datetime: DateTime, location: GeoPosition): Promise<BirthChart> {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post('/birth-chart', {
          datetime,
          location
        });
        return response.data;
      } catch (error) {
        throw this.handleApiError(error);
      }
    });
  }

  async calculateTransits(birthChart: BirthChart, date: DateTime): Promise<TransitAspect[]> {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post('/transits', {
          birthChart,
          date
        });
        return response.data;
      } catch (error) {
        throw this.handleApiError(error);
      }
    });
  }

  async calculateTransitWindows(birthChart: BirthChart, date: DateTime): Promise<TransitWindow[]> {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post('/transit-windows', {
          birthChart,
          date
        });
        return response.data;
      } catch (error) {
        throw this.handleApiError(error);
      }
    });
  }

  async calculatePlanetaryPositions(date: DateTime): Promise<CelestialBody[]> {
    try {
      const response = await this.client.post('/positions', {
        date
      });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async calculateLunarPhases(startDate: DateTime, endDate: DateTime): Promise<LunarPhase[]> {
    try {
      const response = await this.client.post('/lunar-phases', {
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async calculateFixedStars(date: DateTime): Promise<FixedStar[]> {
    try {
      const response = await this.client.post('/fixed-stars', {
        date
      });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async calculateSignificantEvents(startDate: DateTime, endDate: DateTime): Promise<SignificantEvent[]> {
    try {
      const response = await this.client.post('/significant-events', {
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async retryRequest<T>(fn: () => Promise<T>): Promise<T> {
    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          logger.warn(`Request failed, retrying (attempt ${attempt}/${this.maxRetries})...`, { error });
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    throw lastError;
  }

  private handleApiError(error: unknown): never {
    logger.error('KerykeionClient API error:', { error });
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 400) {
        throw new CalculationError('Invalid calculation parameters');
      }
      if (status && status >= 500) {
        throw new ServiceUnavailableError('Kerykeion service is currently unavailable');
      }
    }
    
    throw new ServiceUnavailableError('Unexpected error occurred while communicating with Kerykeion service');
  }
} 