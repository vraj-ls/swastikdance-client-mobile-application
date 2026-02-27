/**
 * Validation utilities for form fields
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {string|null} - Error message or null if valid
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  if (!password) {
    return 'Password is required';
  }

  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (requireNumber && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }

  return null;
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }

  if (typeof value === 'string' && !value.trim()) {
    return `${fieldName} is required`;
  }

  return null;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validatePhoneNumber = (phone) => {
  if (!phone) {
    return 'Phone number is required';
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Australian phone numbers are typically 10 digits (mobile) or 8-10 digits (landline)
  if (cleaned.length < 8 || cleaned.length > 10) {
    return 'Please enter a valid phone number';
  }

  return null;
};

/**
 * Validate date of birth
 * @param {string|Date} dob - Date of birth to validate
 * @param {Object} options - Validation options
 * @returns {string|null} - Error message or null if valid
 */
export const validateDateOfBirth = (dob, options = {}) => {
  const { minAge = 0, maxAge = 120 } = options;

  if (!dob) {
    return 'Date of birth is required';
  }

  const date = typeof dob === 'string' ? new Date(dob) : dob;

  if (isNaN(date.getTime())) {
    return 'Please enter a valid date';
  }

  // Check if date is in the future
  if (date > new Date()) {
    return 'Date of birth cannot be in the future';
  }

  // Calculate age
  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  if (actualAge < minAge) {
    return `Must be at least ${minAge} years old`;
  }

  if (actualAge > maxAge) {
    return 'Please enter a valid date of birth';
  }

  return null;
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (!value) {
    return `${fieldName} is required`;
  }

  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }

  return null;
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateMaxLength = (value, maxLength, fieldName = 'This field') => {
  if (value && value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }

  return null;
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {string|null} - Error message or null if valid
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
};

/**
 * Create a validator that combines multiple validators
 * @param  {...Function} validators - Validator functions
 * @returns {Function} - Combined validator function
 */
export const composeValidators = (...validators) => {
  return (value, allValues) => {
    for (const validator of validators) {
      const error = validator(value, allValues);
      if (error) {
        return error;
      }
    }
    return null;
  };
};
