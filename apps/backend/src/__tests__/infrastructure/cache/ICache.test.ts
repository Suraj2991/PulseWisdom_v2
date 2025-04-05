import { ICache } from '../../../infrastructure/cache/ICache';
import { CelestialBody } from '../../../types/ephemeris.types';

describe('ICache Interface', () => {
  let mockCache: jest.Mocked<ICache>;

  const mockPlanetaryPositions: CelestialBody[] = [
    {
      id: 1,
      name: 'Sun',
      longitude: 0,
      latitude: 0,
      speed: 1,
      house: 1,
      sign: 'Aries',
      signLongitude: 0
    }
  ];

  const mockBirthChart = {
    id: 'test-id',
    datetime: new Date(),
    location: {
      latitude: 0,
      longitude: 0
    }
  };

  const mockInsight = {
    id: 'test-insight',
    type: 'daily',
    content: 'Test insight'
  };

  beforeEach(() => {
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      keys: jest.fn(),
      clear: jest.fn(),
      exists: jest.fn(),
      getPlanetaryPositions: jest.fn(),
      setPlanetaryPositions: jest.fn(),
      getBirthChart: jest.fn(),
      setBirthChart: jest.fn(),
      deleteBirthChart: jest.fn(),
      getInsight: jest.fn(),
      setInsight: jest.fn(),
      deleteInsight: jest.fn(),
      clearCache: jest.fn(),
      disconnect: jest.fn()
    } as jest.Mocked<ICache>;
  });

  describe('Basic Cache Operations', () => {
    it('should have get method', async () => {
      mockCache.get.mockResolvedValue({ data: 'test' });
      const result = await mockCache.get('test-key');
      expect(result).toEqual({ data: 'test' });
      expect(mockCache.get).toHaveBeenCalledWith('test-key');
    });

    it('should have set method', async () => {
      await mockCache.set('test-key', { data: 'test' }, 3600);
      expect(mockCache.set).toHaveBeenCalledWith('test-key', { data: 'test' }, 3600);
    });

    it('should have delete method', async () => {
      await mockCache.delete('test-key');
      expect(mockCache.delete).toHaveBeenCalledWith('test-key');
    });

    it('should have keys method', async () => {
      mockCache.keys.mockResolvedValue(['test:1', 'test:2']);
      const result = await mockCache.keys('test:*');
      expect(result).toEqual(['test:1', 'test:2']);
      expect(mockCache.keys).toHaveBeenCalledWith('test:*');
    });

    it('should have clear method', async () => {
      await mockCache.clear();
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should have exists method', async () => {
      mockCache.exists.mockResolvedValue(true);
      const result = await mockCache.exists('test-key');
      expect(result).toBe(true);
      expect(mockCache.exists).toHaveBeenCalledWith('test-key');
    });
  });

  describe('Domain-Specific Operations', () => {
    describe('Planetary Positions', () => {
      it('should have getPlanetaryPositions method', async () => {
        mockCache.getPlanetaryPositions.mockResolvedValue(mockPlanetaryPositions);
        const result = await mockCache.getPlanetaryPositions();
        expect(result).toEqual(mockPlanetaryPositions);
      });

      it('should have setPlanetaryPositions method', async () => {
        await mockCache.setPlanetaryPositions(mockPlanetaryPositions);
        expect(mockCache.setPlanetaryPositions).toHaveBeenCalledWith(mockPlanetaryPositions);
      });
    });

    describe('Birth Charts', () => {
      it('should have getBirthChart method', async () => {
        mockCache.getBirthChart.mockResolvedValue(mockBirthChart);
        const result = await mockCache.getBirthChart('test-id');
        expect(result).toEqual(mockBirthChart);
        expect(mockCache.getBirthChart).toHaveBeenCalledWith('test-id');
      });

      it('should have setBirthChart method', async () => {
        await mockCache.setBirthChart('test-id', mockBirthChart);
        expect(mockCache.setBirthChart).toHaveBeenCalledWith('test-id', mockBirthChart);
      });

      it('should have deleteBirthChart method', async () => {
        await mockCache.deleteBirthChart('test-id');
        expect(mockCache.deleteBirthChart).toHaveBeenCalledWith('test-id');
      });
    });

    describe('Insights', () => {
      it('should have getInsight method', async () => {
        mockCache.getInsight.mockResolvedValue(mockInsight);
        const result = await mockCache.getInsight('test-insight');
        expect(result).toEqual(mockInsight);
        expect(mockCache.getInsight).toHaveBeenCalledWith('test-insight');
      });

      it('should have setInsight method', async () => {
        await mockCache.setInsight('test-insight', mockInsight);
        expect(mockCache.setInsight).toHaveBeenCalledWith('test-insight', mockInsight);
      });

      it('should have deleteInsight method', async () => {
        await mockCache.deleteInsight('test-insight');
        expect(mockCache.deleteInsight).toHaveBeenCalledWith('test-insight');
      });
    });
  });

  describe('Cache Management', () => {
    it('should have clearCache method', async () => {
      await mockCache.clearCache();
      expect(mockCache.clearCache).toHaveBeenCalled();
    });

    it('should have disconnect method', async () => {
      await mockCache.disconnect();
      expect(mockCache.disconnect).toHaveBeenCalled();
    });
  });
}); 