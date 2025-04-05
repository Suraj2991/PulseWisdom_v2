import { KerykeionClient } from '../KerykeionClient';
import axios from 'axios';
import { DateTime, GeoPosition, HouseSystem } from '@pulsewisdom/astro';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KerykeionClient', () => {
  let client: KerykeionClient;
  const baseUrl = 'http://localhost:8000';

  beforeEach(() => {
    client = new KerykeionClient(baseUrl);
    jest.clearAllMocks();
  });

  describe('calculateBirthChart', () => {
    const datetime: DateTime = {
      year: 1991,
      month: 9,
      day: 29,
      hour: 11,
      minute: 44,
      second: 0,
      timezone: 'Asia/Kolkata'
    };

    const location: GeoPosition = {
      latitude: 19.076,
      longitude: 72.8777
    };

    const mockBirthChart = {
      bodies: [],
      houses: { system: HouseSystem.PLACIDUS, cusps: [] },
      aspects: [],
      angles: { ascendant: 0, midheaven: 0, descendant: 0, imumCoeli: 0 }
    };

    it('should calculate birth chart successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockBirthChart });

      const result = await client.calculateBirthChart(datetime, location);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/api/v1/ephemeris/birth-chart`,
        {
          datetime,
          location,
          house_system: HouseSystem.PLACIDUS
        }
      );
      expect(result).toEqual(mockBirthChart);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockedAxios.post.mockRejectedValueOnce({ 
        isAxiosError: true,
        response: { data: { detail: errorMessage } }
      });

      await expect(client.calculateBirthChart(datetime, location))
        .rejects
        .toThrow(`Failed to calculate birth chart: ${errorMessage}`);
    });
  });

  describe('calculateTransits', () => {
    const date: DateTime = {
      year: 2024,
      month: 4,
      day: 1,
      hour: 12,
      minute: 0,
      second: 0,
      timezone: 'UTC'
    };

    const mockBirthChart = {
      bodies: [],
      houses: { system: HouseSystem.PLACIDUS, cusps: [] },
      aspects: [],
      angles: { ascendant: 0, midheaven: 0, descendant: 0, imumCoeli: 0 }
    };

    const mockTransits = [
      {
        natalPlanet: 'SUN',
        transitPlanet: 'JUPITER',
        aspectType: 'trine',
        angle: 120,
        orb: 1,
        isApplying: true,
        strength: 'high'
      }
    ];

    it('should calculate transits successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockTransits });

      const result = await client.calculateTransits(mockBirthChart, date);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${baseUrl}/api/v1/ephemeris/transits`,
        {
          birth_chart: mockBirthChart,
          date
        }
      );
      expect(result).toEqual(mockTransits);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'API Error';
      mockedAxios.post.mockRejectedValueOnce({ 
        isAxiosError: true,
        response: { data: { detail: errorMessage } }
      });

      await expect(client.calculateTransits(mockBirthChart, date))
        .rejects
        .toThrow(`Failed to calculate transits: ${errorMessage}`);
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200 });

      const result = await client.healthCheck();

      expect(mockedAxios.get).toHaveBeenCalledWith(`${baseUrl}/health`);
      expect(result).toBe(true);
    });

    it('should return false when service is unhealthy', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.healthCheck();

      expect(result).toBe(false);
    });
  });
}); 