import {
  AppError,
  DomainError,
  AstrologicalError,
  CalculationError,
  ValidationError,
  DatabaseError,
  CacheError,
  NotFoundError,
  ConfigurationError,
  AuthError,
  AuthorizationError,
  RateLimitError,
  ServiceUnavailableError,
  ServiceError
} from '../../types/errors';

describe('Error Types', () => {
  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
      expect(error.name).toBe('AppError');
    });

    it('should create an AppError with custom values', () => {
      const details = { field: 'test' };
      const error = new AppError('Test message', 'CUSTOM_ERROR', 400, details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('DomainError', () => {
    it('should create a DomainError with default values', () => {
      const error = new DomainError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('DOMAIN_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it('should create a DomainError with custom values', () => {
      const details = { field: 'test' };
      const error = new DomainError('Test message', 'CUSTOM_DOMAIN_ERROR', 422, details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CUSTOM_DOMAIN_ERROR');
      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual(details);
    });
  });

  describe('AstrologicalError', () => {
    it('should create an AstrologicalError with default values', () => {
      const error = new AstrologicalError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('ASTROLOGICAL_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it('should create an AstrologicalError with custom values', () => {
      const details = { planet: 'Mars' };
      const error = new AstrologicalError('Test message', 'CUSTOM_ASTRO_ERROR', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CUSTOM_ASTRO_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('CalculationError', () => {
    it('should create a CalculationError with default values', () => {
      const error = new CalculationError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CALCULATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it('should create a CalculationError with custom values', () => {
      const details = { calculation: 'transit' };
      const error = new CalculationError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CALCULATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with default values', () => {
      const error = new ValidationError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it('should create a ValidationError with custom values', () => {
      const details = { field: 'email', message: 'Invalid email format' };
      const error = new ValidationError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('DatabaseError', () => {
    it('should create a DatabaseError with default values', () => {
      const error = new DatabaseError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });

    it('should create a DatabaseError with custom values', () => {
      const details = { operation: 'insert' };
      const error = new DatabaseError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual(details);
    });
  });

  describe('CacheError', () => {
    it('should create a CacheError with default values', () => {
      const error = new CacheError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });

    it('should create a CacheError with custom values', () => {
      const details = { operation: 'get' };
      const error = new CacheError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with default values', () => {
      const error = new NotFoundError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.details).toBeUndefined();
    });

    it('should create a NotFoundError with custom values', () => {
      const details = { resource: 'user' };
      const error = new NotFoundError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual(details);
    });
  });

  describe('ConfigurationError', () => {
    it('should create a ConfigurationError with default values', () => {
      const error = new ConfigurationError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });

    it('should create a ConfigurationError with custom values', () => {
      const details = { config: 'database' };
      const error = new ConfigurationError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual(details);
    });
  });

  describe('AuthError', () => {
    it('should create an AuthError with default values', () => {
      const error = new AuthError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.details).toBeUndefined();
    });

    it('should create an AuthError with custom values', () => {
      const details = { reason: 'invalid_credentials' };
      const error = new AuthError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.details).toEqual(details);
    });
  });

  describe('AuthorizationError', () => {
    it('should create an AuthorizationError with default values', () => {
      const error = new AuthorizationError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.details).toBeUndefined();
    });

    it('should create an AuthorizationError with custom values', () => {
      const details = { requiredRole: 'admin' };
      const error = new AuthorizationError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.details).toEqual(details);
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with default values', () => {
      const error = new RateLimitError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.details).toBeUndefined();
    });

    it('should create a RateLimitError with custom values', () => {
      const details = { limit: 100, remaining: 0 };
      const error = new RateLimitError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.details).toEqual(details);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create a ServiceUnavailableError with default values', () => {
      const error = new ServiceUnavailableError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.details).toBeUndefined();
    });

    it('should create a ServiceUnavailableError with custom values', () => {
      const details = { service: 'database' };
      const error = new ServiceUnavailableError('Test message', details);
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.details).toEqual(details);
    });
  });

  describe('ServiceError', () => {
    it('should create a ServiceError with message', () => {
      const error = new ServiceError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('ServiceError');
    });
  });
}); 