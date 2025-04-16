import { ValidationError } from '../errors';
import { IUser } from '../models/User';

// Email regex pattern for basic email validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Password regex pattern requiring at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validates user registration data
 * @param userData - User registration data
 * @throws ValidationError if any validation fails
 */
export function validateUserRegistration(userData: Partial<IUser>): void {
  if (!userData.email) {
    throw new ValidationError('Email is required');
  }
  
  const email = userData.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (!userData.password) {
    throw new ValidationError('Password is required');
  }
  
  if (!PASSWORD_REGEX.test(userData.password)) {
    throw new ValidationError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }

  if (userData.firstName) {
    const firstName = userData.firstName.trim();
    if (firstName.length < 2) {
      throw new ValidationError('First name must be at least 2 characters long');
    }
  }

  if (userData.lastName) {
    const lastName = userData.lastName.trim();
    if (lastName.length < 2) {
      throw new ValidationError('Last name must be at least 2 characters long');
    }
  }

  if (userData.birthDate) {
    const birthDate = new Date(userData.birthDate);
    if (isNaN(birthDate.getTime())) {
      throw new ValidationError('Invalid birth date');
    }
    
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      throw new ValidationError('User must be at least 13 years old');
    }
  }
}

/**
 * Validates user update data
 * @param updateData - User update data
 * @throws ValidationError if any validation fails
 */
export function validateUserUpdate(updateData: Partial<IUser>): void {
  if (updateData.email) {
    const email = updateData.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  if (updateData.password) {
    if (!PASSWORD_REGEX.test(updateData.password)) {
      throw new ValidationError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
  }

  if (updateData.firstName) {
    const firstName = updateData.firstName.trim();
    if (firstName.length < 2) {
      throw new ValidationError('First name must be at least 2 characters long');
    }
  }

  if (updateData.lastName) {
    const lastName = updateData.lastName.trim();
    if (lastName.length < 2) {
      throw new ValidationError('Last name must be at least 2 characters long');
    }
  }
}

export function validateUserData(userData: any): void {
  // Validate email
  if (!userData.email) {
    throw new ValidationError('Email is required');
  }
  const email = userData.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Validate name
  if (!userData.name || typeof userData.name !== 'string' || userData.name.trim().length === 0) {
    throw new ValidationError('Name is required and must be a non-empty string');
  }

  // Validate password
  if (!userData.password) {
    throw new ValidationError('Password is required');
  }
  if (!PASSWORD_REGEX.test(userData.password)) {
    throw new ValidationError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  }
} 