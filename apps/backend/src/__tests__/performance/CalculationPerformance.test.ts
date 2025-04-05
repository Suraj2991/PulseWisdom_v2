import { Types } from 'mongoose';
import { BirthChartService } from '../../services/BirthChartService';
import { TransitService } from '../../services/TransitService';
import { ICache } from '../../infrastructure/cache/ICache';
import { IBirthChart } from '../../models/BirthChart';
import { EphemerisService } from '../../services/EphemerisService';
import { DateTime, GeoPosition, HouseSystem } from '../../types/ephemeris.types';
import { KerykeionClient } from '../../clients/KerykeionClient';

// Mock KerykeionClient
jest.mock('../../clients/KerykeionClient', () => ({
  KerykeionClient: jest.fn().mockImplementation(() => ({
    calculateBirthChart: jest.fn().mockResolvedValue({
      datetime: {
        year: 1990,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      },
      location: {
        latitude: 40.7128,
        longitude: -74.006
      },
      bodies: [],
      angles: {
        ascendant: 0,
        midheaven: 0,
        descendant: 0,
        imumCoeli: 0
      },
      houses: {
        system: 'placidus',
        cusps: []
      }
    }),
    calculateTransits: jest.fn().mockResolvedValue([]),
    calculateTransitWindows: jest.fn().mockResolvedValue([])
  }))
}));

// Mock cache implementation
const mockCache: ICache = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
  exists: jest.fn().mockResolvedValue(false),
  getPlanetaryPositions: jest.fn().mockResolvedValue(null),
  setPlanetaryPositions: jest.fn(),
  getBirthChart: jest.fn().mockResolvedValue(null),
  setBirthChart: jest.fn(),
  deleteBirthChart: jest.fn(),
  getInsight: jest.fn().mockResolvedValue(null),
  setInsight: jest.fn(),
  deleteInsight: jest.fn(),
  clearCache: jest.fn(),
  disconnect: jest.fn()
};

describe('Calculation Performance', () => {
  let birthChartService: BirthChartService;
  let transitService: TransitService;
  let ephemerisService: EphemerisService;
  let mockBirthChart: IBirthChart & { _id: Types.ObjectId };

  beforeEach(() => {
    ephemerisService = new EphemerisService(mockCache, 'http://localhost:3000');
    birthChartService = new BirthChartService(mockCache, ephemerisService);
    transitService = new TransitService(mockCache, ephemerisService);

    mockBirthChart = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      datetime: {
        year: 1990,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      },
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        placeName: 'New York'
      },
      userId: '507f1f77bcf86cd799439012',
      bodies: [],
      angles: {
        ascendant: 0,
        midheaven: 0,
        descendant: 0,
        imumCoeli: 0
      },
      houses: {
        system: 'placidus',
        cusps: []
      }
    } as unknown as IBirthChart & { _id: Types.ObjectId };
  });

  describe('Birth Chart Calculations', () => {
    it('should calculate birth chart within acceptable time', async () => {
      const datetime: DateTime = {
        year: 1990,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      const location: GeoPosition = {
        latitude: 40.7128,
        longitude: -74.006
      };

      const startTime = Date.now();
      await birthChartService.calculateBirthChart(datetime, location, HouseSystem.PLACIDUS);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Transit Calculations', () => {
    it('should calculate transits within acceptable time', async () => {
      const date: DateTime = {
        year: 2024,
        month: 3,
        day: 20,
        hour: 0,
        minute: 0,
        second: 0,
        timezone: 'UTC'
      };

      const startTime = Date.now();
      await transitService.calculateTransits(mockBirthChart, date);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
}); 