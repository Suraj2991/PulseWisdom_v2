// ValidationError is used by CommonValidator internally
import { ValidationError } from '../../../domain/errors';
import { CommonValidator } from '../../../shared/validation/common';
import { z } from 'zod';
import { RegisterData, LoginCredentials, ChangePasswordData } from '../types/auth.types';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const changePasswordSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export function validatePasswordReset(data: { email: string; newPassword: string }): void {
  const errors: string[] = [];

  try {
    // Validate email
    CommonValidator.validateEmail(data.email);

    // Validate new password
    CommonValidator.validatePassword(data.newPassword);
  } catch (error) {
    if (error instanceof ValidationError && error.details) {
      if (Array.isArray(error.details)) {
        errors.push(...error.details);
      } else {
        errors.push(String(error.details));
      }
    } else {
      errors.push('Invalid input data');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Password reset validation failed', errors);
  }
}

export function validateLogin(data: LoginCredentials): void {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid login data', result.error.errors.map(e => e.message));
  }
}

export function validateRegistration(data: RegisterData): void {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid registration data', result.error.errors.map(e => e.message));
  }
}

export function validatePasswordChange(data: ChangePasswordData): void {
  const result = changePasswordSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid password change data', result.error.errors.map(e => e.message));
  }
} 