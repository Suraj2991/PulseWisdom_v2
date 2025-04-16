import { ValidationError } from '../errors';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export function validatePasswordReset(input: { email: string, newPassword: string }): void {
  // Validate email
  if (!input.email) {
    throw new ValidationError('Email is required');
  }
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Validate password
  if (!input.newPassword) {
    throw new ValidationError('New password is required');
  }
  if (!PASSWORD_REGEX.test(input.newPassword)) {
    throw new ValidationError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }
} 