import { ValidationError } from '../../../domain/errors';
import { CommonValidator } from '../../../shared/validation/common';

export function validatePasswordReset(data: { email: string; newPassword: string }): void {
  // Validate email
  CommonValidator.validateEmail(data.email);

  // Validate new password
  CommonValidator.validatePassword(data.newPassword);
}

export function validateLogin(data: { email: string; password: string }): void {
  // Validate email
  CommonValidator.validateEmail(data.email);

  // Validate password
  CommonValidator.validatePassword(data.password);
}

export function validateRegistration(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): void {
  // Validate email
  CommonValidator.validateEmail(data.email);

  // Validate password
  CommonValidator.validatePassword(data.password);

  // Validate names
  CommonValidator.validateName(data.firstName);
  CommonValidator.validateName(data.lastName);
} 