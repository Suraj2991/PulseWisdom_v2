import { BaseError } from './BaseError';

export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
} 