/**
 * Type for error details that can include various data types
 */
export type ErrorDetails = {
  [key: string]: unknown;
} | string[] | null;

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: number = 500,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Base class for all domain-specific errors
 */
export class DomainError extends AppError {
  constructor(
    message: string,
    code = 'DOMAIN_ERROR',
    statusCode = 400,
    details?: ErrorDetails
  ) {
    super(message, code, statusCode, details);
  }
}

/**
 * Base class for all astrological calculation errors
 */
export class AstrologicalError extends DomainError {
  constructor(
    message: string,
    code = 'ASTROLOGICAL_ERROR',
    details?: ErrorDetails
  ) {
    super(message, code, 400, details);
  }
}

/**
 * Error thrown when calculations fail
 */
export class CalculationError extends AstrologicalError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'CALCULATION_ERROR', details);
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends DomainError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Error thrown when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Error thrown when cache operations fail
 */
export class CacheError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'CACHE_ERROR', 500, details);
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}

/**
 * Error thrown for authentication/authorization failures
 */
export class AuthError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'AUTH_ERROR', 401, details);
  }
}

/**
 * Error thrown for authorization failures
 */
export class AuthorizationError extends AuthError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, details);
    this.code = 'AUTHORIZATION_ERROR';
    this.statusCode = 403;
  }
}

/**
 * Error thrown when rate limiting is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
  }
}

/**
 * Error thrown when a service is unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
} 