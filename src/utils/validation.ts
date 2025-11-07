/**
 * Validation utilities for forms
 * Comprehensive validation for all input types
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}

/**
 * Get email validation error message
 */
export function getEmailError(email: string): string | null {
  if (!email) return null; // Empty is OK for optional fields
  if (!email.includes('@')) return 'Email must contain @';
  if (!isValidEmail(email)) return 'Please enter a valid email address';
  return null;
}

/**
 * Validate phone number (10 digits for US)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');

  // US phone numbers should be 10 digits (or 11 with country code)
  return digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly[0] === '1');
}

/**
 * Get phone validation error message
 */
export function getPhoneError(phone: string): string | null {
  if (!phone) return 'Phone number is required';

  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 0) return 'Please enter a phone number';
  if (digitsOnly.length < 10) return `Need ${10 - digitsOnly.length} more digit${10 - digitsOnly.length > 1 ? 's' : ''}`;
  if (digitsOnly.length > 11) return 'Phone number is too long';
  if (digitsOnly.length === 11 && digitsOnly[0] !== '1') return 'Invalid country code';

  return null;
}

/**
 * Validate name (first or last)
 */
export function isValidName(name: string): boolean {
  if (!name || !name.trim()) return false;

  // Name should be at least 2 characters
  if (name.trim().length < 2) return false;

  // Name should only contain letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[A-Za-z\s'-]+$/;
  return nameRegex.test(name.trim());
}

/**
 * Get name validation error message
 */
export function getNameError(name: string, fieldName: string = 'Name'): string | null {
  if (!name || !name.trim()) return `${fieldName} is required`;
  if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
  if (!/^[A-Za-z\s'-]+$/.test(name.trim())) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  return null;
}

/**
 * Split full name into first and last name
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // Handle middle names by putting everything after first name as last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}

/**
 * Validate full name (must have at least first name)
 */
export function isValidFullName(fullName: string): boolean {
  if (!fullName || !fullName.trim()) return false;

  const { firstName } = splitFullName(fullName);
  return isValidName(firstName);
}

/**
 * Get full name validation error
 */
export function getFullNameError(fullName: string): string | null {
  if (!fullName || !fullName.trim()) return 'Name is required';

  const { firstName, lastName } = splitFullName(fullName);

  if (!firstName) return 'First name is required';
  if (firstName.length < 2) return 'First name must be at least 2 characters';
  if (!/^[A-Za-z\s'-]+$/.test(firstName)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';

  // Last name is optional, but validate if provided
  if (lastName && !/^[A-Za-z\s'-]+$/.test(lastName)) {
    return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
  }

  return null;
}

/**
 * Capitalize name properly (handles McDonald, O'Brien, etc.)
 */
export function capitalizeName(name: string): string {
  if (!name) return '';

  return name
    .split(/(\s+|-)/)
    .map(part => {
      if (!part || part === ' ' || part === '-') return part;

      // Handle special cases
      if (part.toLowerCase().startsWith('mc')) {
        return 'Mc' + part.slice(2).charAt(0).toUpperCase() + part.slice(3).toLowerCase();
      }
      if (part.toLowerCase().startsWith("o'")) {
        return "O'" + part.slice(2).charAt(0).toUpperCase() + part.slice(3).toLowerCase();
      }

      // Normal case
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Format name as it's typed (auto-capitalize)
 */
export function formatNameInput(name: string): string {
  if (!name) return '';

  // Only capitalize after user has typed a space or hyphen
  const lastChar = name[name.length - 1];
  if (lastChar === ' ' || lastChar === '-') {
    return name;
  }

  // If user just started typing a new word
  const secondLastChar = name[name.length - 2];
  if (secondLastChar === ' ' || secondLastChar === '-' || name.length === 1) {
    const beforeLast = name.slice(0, -1);
    const last = name[name.length - 1].toUpperCase();
    return beforeLast + last;
  }

  return name;
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Get required field error
 */
export function getRequiredError(value: any, fieldName: string): string | null {
  if (!isRequired(value)) return `${fieldName} is required`;
  return null;
}