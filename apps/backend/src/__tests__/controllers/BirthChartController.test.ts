import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { BirthChartController } from '../../controllers/BirthChartController';
import { BirthChartService } from '../../services/BirthChartService';
import { ValidationError, NotFoundError } from '../../types/errors';
import { DateTime, GeoPosition, HouseSystem, BirthChart } from '../../types/ephemeris.types';
import { IBirthChart } from '../../models/BirthChart';

jest.mock('../../services/BirthChartService');

describe('BirthChartController', () => {
  let birthChartController: BirthChartController;
  let mockBirthChartService: jest.Mocked<BirthChartService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockUserId = 'user123';
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

  const mockLocation: GeoPosition = {
    latitude: 40.7128,
    longitude: -74.0060
  };

  const mockBirthChart: BirthChart = {
    datetime: mockDateTime,
    location: mockLocation,
    bodies: [],
    houses: {
      system: HouseSystem.PLACIDUS,
      cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
    },
    angles: {
      ascendant: 0,
      midheaven: 90,
      descendant: 180,
      imumCoeli: 270
    },
    aspects: []
  };

  beforeEach(() => {
    mockBirthChartService = {
      createBirthChart: jest.fn().mockResolvedValue(mockBirthChart),
      getBirthChartById: jest.fn().mockResolvedValue(mockBirthChart),
      updateBirthChart: jest.fn().mockResolvedValue(mockBirthChart),
      deleteBirthChart: jest.fn().mockResolvedValue(true),
      getBirthChartsByUserId: jest.fn().mockResolvedValue([mockBirthChart]),
      calculateBirthChart: jest.fn().mockResolvedValue(mockBirthChart)
    } as unknown as jest.Mocked<BirthChartService>;

    mockRequest = {
      params: {},
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    mockNext = jest.fn();

    birthChartController = new BirthChartController(mockBirthChartService);
    jest.clearAllMocks();
  });

  describe('createBirthChart', () => {
    it('should create a birth chart successfully', async () => {
      mockRequest.body = {
        userId: mockUserId,
        datetime: mockDateTime,
        location: mockLocation
      };

      await birthChartController.createBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBirthChartService.createBirthChart).toHaveBeenCalledWith(
        mockUserId,
        mockDateTime,
        mockLocation
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBirthChart);
    });

    it('should handle missing user ID', async () => {
      mockRequest.body = {
        datetime: mockDateTime,
        location: mockLocation
      };

      await birthChartController.createBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User ID is required'
        })
      );
    });

    it('should handle invalid datetime', async () => {
      mockRequest.body = {
        userId: mockUserId,
        datetime: { ...mockDateTime, month: 13 },
        location: mockLocation
      };

      await birthChartController.createBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid month. Must be between 1 and 12.'
        })
      );
    });

    it('should handle invalid location', async () => {
      mockRequest.body = {
        userId: mockUserId,
        datetime: mockDateTime,
        location: { ...mockLocation, latitude: 91 }
      };

      await birthChartController.createBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid latitude. Must be between -90 and 90 degrees.'
        })
      );
    });
  });

  describe('getBirthChartById', () => {
    it('should get a birth chart by ID successfully', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };

      await birthChartController.getBirthChartById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBirthChartService.getBirthChartById).toHaveBeenCalledWith(mockBirthChartId);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBirthChart);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest.params = {};

      await birthChartController.getBirthChartById(
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

    it('should handle non-existent birth chart', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockBirthChartService.getBirthChartById.mockResolvedValue(null);

      await birthChartController.getBirthChartById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Birth chart not found'
        })
      );
    });
  });

  describe('updateBirthChart', () => {
    it('should update a birth chart successfully', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.body = {
        datetime: mockDateTime,
        location: mockLocation
      };

      await birthChartController.updateBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBirthChartService.updateBirthChart).toHaveBeenCalledWith(
        mockBirthChartId,
        mockRequest.body
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockBirthChart);
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest.params = {};
      mockRequest.body = {
        datetime: mockDateTime,
        location: mockLocation
      };

      await birthChartController.updateBirthChart(
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

    it('should handle invalid datetime in update', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.body = {
        datetime: { ...mockDateTime, month: 13 }
      };

      await birthChartController.updateBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid month. Must be between 1 and 12.'
        })
      );
    });

    it('should handle invalid location in update', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockRequest.body = {
        location: { ...mockLocation, latitude: 91 }
      };

      await birthChartController.updateBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid latitude. Must be between -90 and 90 degrees.'
        })
      );
    });
  });

  describe('deleteBirthChart', () => {
    it('should delete a birth chart successfully', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };

      await birthChartController.deleteBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBirthChartService.deleteBirthChart).toHaveBeenCalledWith(mockBirthChartId);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle missing birth chart ID', async () => {
      mockRequest.params = {};

      await birthChartController.deleteBirthChart(
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

    it('should handle deletion failure', async () => {
      mockRequest.params = { birthChartId: mockBirthChartId };
      mockBirthChartService.deleteBirthChart.mockResolvedValue(false);

      await birthChartController.deleteBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to delete birth chart'
        })
      );
    });
  });

  describe('getBirthChartsByUserId', () => {
    it('should get birth charts by user ID successfully', async () => {
      mockRequest.params = { userId: mockUserId };

      await birthChartController.getBirthChartsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBirthChartService.getBirthChartsByUserId).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.json).toHaveBeenCalledWith([mockBirthChart]);
    });

    it('should handle missing user ID', async () => {
      mockRequest.params = {};

      await birthChartController.getBirthChartsByUserId(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User ID is required'
        })
      );
    });
  });

  describe('calculateBirthChart', () => {
    it('should calculate a birth chart successfully', async () => {
      mockRequest.body = {
        datetime: mockDateTime,
        location: mockLocation,
        houseSystem: HouseSystem.PLACIDUS
      };

      await birthChartController.calculateBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBirthChartService.calculateBirthChart).toHaveBeenCalledWith(
        mockDateTime,
        mockLocation,
        HouseSystem.PLACIDUS
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockBirthChart);
    });

    it('should handle invalid datetime', async () => {
      mockRequest.body = {
        datetime: { ...mockDateTime, month: 13 },
        location: mockLocation
      };

      await birthChartController.calculateBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid month. Must be between 1 and 12.'
        })
      );
    });

    it('should handle invalid location', async () => {
      mockRequest.body = {
        datetime: mockDateTime,
        location: { ...mockLocation, latitude: 91 }
      };

      await birthChartController.calculateBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid latitude. Must be between -90 and 90 degrees.'
        })
      );
    });

    it('should handle invalid house system', async () => {
      mockRequest.body = {
        datetime: mockDateTime,
        location: mockLocation,
        houseSystem: 'INVALID'
      };

      await birthChartController.calculateBirthChart(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid house system. Must be one of: PLACIDUS, KOCH, CAMPANUS, REGIOMONTANUS, WHOLE_SIGN, EQUAL'
        })
      );
    });
  });
}); 