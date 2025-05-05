import { ValidationError } from '../../../domain/errors';
import { CommonValidator } from '../../../shared/validation/common';
import { IUser } from '../models/UserModel';
import { USER_VALIDATION, USER_ROLES, USER_STATUS } from '../../../shared/constants/user';

/**
 * Validates user registration data
 * @param userData - User registration data
 * @throws ValidationError if any validation fails
 */
export function validateUserRegistration(userData: Partial<IUser>): void {
  if (!userData.email) {
    throw new ValidationError('Email is required');
  }
  CommonValidator.validateEmail(userData.email);

  if (!userData.password) {
    throw new ValidationError('Password is required');
  }
  CommonValidator.validatePassword(userData.password);

  if (!userData.firstName) {
    throw new ValidationError('First name is required');
  }
  CommonValidator.validateName(userData.firstName);

  if (!userData.lastName) {
    throw new ValidationError('Last name is required');
  }
  CommonValidator.validateName(userData.lastName);

  if (userData.birthDate) {
    CommonValidator.validateDate(userData.birthDate.toString());
  }

  if (userData.birthLocation) {
    CommonValidator.validateLocation(userData.birthLocation);
  }

  if (userData.role && !Object.values(USER_ROLES).includes(userData.role)) {
    throw new ValidationError('Invalid user role');
  }

  if (userData.status && !Object.values(USER_STATUS).includes(userData.status)) {
    throw new ValidationError('Invalid user status');
  }

  if (userData.bio && userData.bio.length > USER_VALIDATION.BIO_MAX_LENGTH) {
    throw new ValidationError(`Bio must not exceed ${USER_VALIDATION.BIO_MAX_LENGTH} characters`);
  }
}

/**
 * Validates user update data
 * @param updateData - User update data
 * @throws ValidationError if any validation fails
 */
export function validateUserUpdate(userData: Partial<IUser>): void {
  if (userData.email) {
    CommonValidator.validateEmail(userData.email);
  }

  if (userData.password) {
    CommonValidator.validatePassword(userData.password);
  }

  if (userData.firstName) {
    CommonValidator.validateName(userData.firstName);
  }

  if (userData.lastName) {
    CommonValidator.validateName(userData.lastName);
  }

  if (userData.birthDate) {
    CommonValidator.validateDate(userData.birthDate.toString());
  }

  if (userData.birthLocation) {
    CommonValidator.validateLocation(userData.birthLocation);
  }

  if (userData.role && !Object.values(USER_ROLES).includes(userData.role)) {
    throw new ValidationError('Invalid user role');
  }

  if (userData.status && !Object.values(USER_STATUS).includes(userData.status)) {
    throw new ValidationError('Invalid user status');
  }

  if (userData.bio && userData.bio.length > USER_VALIDATION.BIO_MAX_LENGTH) {
    throw new ValidationError(`Bio must not exceed ${USER_VALIDATION.BIO_MAX_LENGTH} characters`);
  }
} 