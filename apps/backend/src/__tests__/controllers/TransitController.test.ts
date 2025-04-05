import { Request, Response, NextFunction } from 'express';
import { TransitController } from '../../controllers/TransitController';
import { TransitService } from '../../services/TransitService';
import { ValidationError } from '../../types/errors';
import { DateTime } from '../../types/ephemeris.types';
import { TransitAnalysis } from '../../types/transit.types';

jest.mock('../../services/TransitService');

describe('TransitController', () => {
  let transitController: TransitController;
  let mockTransitService: jest.Mocked<TransitService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockBirthChartId = 'chart123';

  const mockDateTime: DateTime = {
    year: 2024,
    month: 3,
    day: 15,
    hour: 12,
    minute: 0,
    second: 0,
    timezone: 'UTC'
  };

  const mockTransitAnalysis: TransitAnalysis = {
    date: mockDateTime,
    transits: [],
    windows: []
  };

  beforeEach(() => {
    mockTransitService = {
      analyzeTransits: jest.fn().mockResolvedValue(mockTransitAnalysis),
      getTransitsByDateRange: jest.fn().mockResolvedValue([mockTransitAnalysis])
    } as unknown as jest.Mocked<TransitService>;

    mockRequest = {
      params: {},
      query: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    transitController = new TransitController(mockTransitService);
    jest.clearAllMocks();
  });

  describe('analyzeTransits', () => {
    it('should analyze transits successfully', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {
        year: '2024',
        month: '3',
        day: '15',
        hour: '12',
        minute: '0',
        second: '0',
        timezone: 'UTC'
      };

      await transitController.analyzeTransits(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockTransitService.analyzeTransits).toHaveBeenCalledWith(
        mockBirthChartId,
        mockDateTime
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockTransitAnalysis);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest.params = {};
      mockRequest.query = {
        year: '2024',
        month: '3',
        day: '15'
      };

      await transitController.analyzeTransits(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Birth chart ID is required'
        })
      );
    });

    it('should handle missing date parameters', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {};

      await transitController.analyzeTransits(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Date parameters are required (year, month, day)'
        })
      );
    });

    it('should handle invalid month', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {
        year: '2024',
        month: '13',
        day: '15'
      };

      await transitController.analyzeTransits(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid month'
        })
      );
    });

    it('should handle invalid day', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {
        year: '2024',
        month: '3',
        day: '32'
      };

      await transitController.analyzeTransits(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid day'
        })
      );
    });
  });

  describe('getTransitsByDateRange', () => {
    it('should get transits by date range successfully', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {
        startDate: '2024-03-15',
        endDate: '2024-03-20'
      };

      await transitController.getTransitsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockTransitService.getTransitsByDateRange).toHaveBeenCalledWith(
        mockBirthChartId,
        expect.objectContaining({
          year: 2024,
          month: 3,
          day: 15
        }),
        expect.objectContaining({
          year: 2024,
          month: 3,
          day: 20
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith([mockTransitAnalysis]);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest.params = {};
      mockRequest.query = {
        startDate: '2024-03-15',
        endDate: '2024-03-20'
      };

      await transitController.getTransitsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Birth chart ID is required'
        })
      );
    });

    it('should handle missing date range parameters', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {};

      await transitController.getTransitsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Start date and end date are required'
        })
      );
    });

    it('should handle invalid start date', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {
        startDate: 'invalid-date',
        endDate: '2024-03-20'
      };

      await transitController.getTransitsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid date format'
        })
      );
    });

    it('should handle invalid end date', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {
        startDate: '2024-03-15',
        endDate: 'invalid-date'
      };

      await transitController.getTransitsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid date format'
        })
      );
    });

    it('should handle end date before start date', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.query = {
        startDate: '2024-03-20',
        endDate: '2024-03-15'
      };

      await transitController.getTransitsByDateRange(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'End date must be after start date'
        })
      );
    });
  });
}); 