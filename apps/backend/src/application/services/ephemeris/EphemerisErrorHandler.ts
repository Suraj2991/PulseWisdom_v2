import { AppError, ValidationError, CalculationError } from '../../../domain/errors';
import { logger } from '../../../shared/logger';
import { ICache } from '../../../infrastructure/cache/ICache';
import { IEphemerisClient } from '../../../domain/ports/IEphemerisClient';

export class EphemerisErrorHandler {
  constructor(
    private readonly cache: ICache,
    private readonly ephemerisClient: IEphemerisClient
  ) {}

  /**
   * Logs an astrology-related error with context
   */
  logAstrologyError(error: Error, context: Record<string, any>): void {
    logger.error('Astrology calculation error', {
      error: error.message,
      stack: error.stack,
      ...context
    });
  }

  /**
   * Handles errors during ephemeris calculations
   * @throws CalculationError
   */
  handleCalculationError(error: Error, context: Record<string, any>): never {
    this.logAstrologyError(error, context);
    throw new CalculationError(
      'Failed to perform astrological calculation: ' + error.message
    );
  }

  /**
   * Handles validation errors for ephemeris inputs
   * @throws ValidationError
   */
  handleValidationError(error: Error, context: Record<string, any>): never {
    this.logAstrologyError(error, context);
    throw new ValidationError(
      'Invalid input for astrological calculation: ' + error.message
    );
  }

  /**
   * Handles errors from the ephemeris client
   * @throws AppError
   */
  handleClientError(error: Error, context: Record<string, any>): never {
    this.logAstrologyError(error, context);
    throw new AppError(
      'Ephemeris client error: ' + error.message
    );
  }

  /**
   * Wraps an async operation with error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: Record<string, any>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ValidationError) {
        this.handleValidationError(error, context);
      }
      if (error instanceof CalculationError) {
        this.handleCalculationError(error, context);
      }
      this.handleClientError(error as Error, context);
    }
  }
} 