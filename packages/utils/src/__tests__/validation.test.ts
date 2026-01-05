/**
 * Validation Utilities Tests
 * Tests for input validation and formatting functions
 */

import { describe, it, expect } from 'vitest';
import {
  getNameError,
  getPhoneError,
  getEmailError,
  isValidEmail,
  isValidPhoneNumber,
  formatNameInput,
  capitalizeName,
} from '../validation';

describe('validation utilities', () => {
  describe('getNameError', () => {
    it('should return error for empty name', () => {
      expect(getNameError('')).toBe('Name is required');
      expect(getNameError('   ')).toBe('Name is required');
    });

    it('should return error for short name', () => {
      expect(getNameError('A')).toBe('Name must be at least 2 characters');
    });

    it('should return error for long name', () => {
      const longName = 'A'.repeat(51);
      expect(getNameError(longName)).toBe('Name must be less than 50 characters');
    });

    it('should return error for invalid characters', () => {
      expect(getNameError('John123')).toContain('can only contain letters');
      expect(getNameError('John@Doe')).toContain('can only contain letters');
    });

    it('should return null for valid names', () => {
      expect(getNameError('John')).toBeNull();
      expect(getNameError('John Doe')).toBeNull();
      expect(getNameError("Mary-Jane O'Brien")).toBeNull();
    });

    it('should use custom field label', () => {
      expect(getNameError('', 'First Name')).toBe('First Name is required');
    });
  });

  describe('getPhoneError', () => {
    it('should return error for empty phone', () => {
      expect(getPhoneError('')).toBe('Phone number is required');
    });

    it('should return error for short phone', () => {
      expect(getPhoneError('123456789')).toBe('Phone number must be at least 10 digits');
    });

    it('should return error for long phone', () => {
      const longPhone = '1'.repeat(16);
      expect(getPhoneError(longPhone)).toBe('Phone number is too long');
    });

    it('should return null for valid phones', () => {
      expect(getPhoneError('1234567890')).toBeNull();
      expect(getPhoneError('(123) 456-7890')).toBeNull();
      expect(getPhoneError('+1 123 456 7890')).toBeNull();
    });

    it('should strip non-digits when validating', () => {
      expect(getPhoneError('123-456-7890')).toBeNull();
    });
  });

  describe('getEmailError', () => {
    it('should return null for empty email (optional field)', () => {
      expect(getEmailError('')).toBeNull();
      expect(getEmailError('   ')).toBeNull();
    });

    it('should return error for invalid email', () => {
      expect(getEmailError('invalid')).toBe('Please enter a valid email address');
      expect(getEmailError('invalid@')).toBe('Please enter a valid email address');
      expect(getEmailError('@domain.com')).toBe('Please enter a valid email address');
      expect(getEmailError('user@domain')).toBe('Please enter a valid email address');
    });

    it('should return null for valid emails', () => {
      expect(getEmailError('user@domain.com')).toBeNull();
      expect(getEmailError('user.name@domain.co.uk')).toBeNull();
      expect(getEmailError('user+tag@domain.com')).toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('should return false for empty values', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });

    it('should return true for valid emails', () => {
      expect(isValidEmail('user@domain.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return false for short phone numbers', () => {
      expect(isValidPhoneNumber('123456789')).toBe(false);
    });

    it('should return false for long phone numbers', () => {
      expect(isValidPhoneNumber('1234567890123456')).toBe(false);
    });

    it('should return true for valid phone numbers', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true);
      expect(isValidPhoneNumber('123-456-7890')).toBe(true);
      expect(isValidPhoneNumber('+1 (123) 456-7890')).toBe(true);
    });
  });

  describe('formatNameInput', () => {
    it('should remove numbers', () => {
      expect(formatNameInput('John123')).toBe('John');
    });

    it('should remove special characters', () => {
      expect(formatNameInput('John@#$%')).toBe('John');
    });

    it('should keep spaces', () => {
      expect(formatNameInput('John Doe')).toBe('John Doe');
    });

    it('should keep hyphens', () => {
      expect(formatNameInput('Mary-Jane')).toBe('Mary-Jane');
    });

    it('should keep apostrophes', () => {
      expect(formatNameInput("O'Brien")).toBe("O'Brien");
    });

    it('should handle empty input', () => {
      expect(formatNameInput('')).toBe('');
    });
  });

  describe('capitalizeName', () => {
    it('should capitalize first letter of each word', () => {
      expect(capitalizeName('john doe')).toBe('John Doe');
    });

    it('should handle all caps', () => {
      expect(capitalizeName('JOHN DOE')).toBe('John Doe');
    });

    it('should handle mixed case', () => {
      expect(capitalizeName('jOhN dOe')).toBe('John Doe');
    });

    it('should handle single word', () => {
      expect(capitalizeName('john')).toBe('John');
    });

    it('should handle empty string', () => {
      expect(capitalizeName('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(capitalizeName('  john doe  ')).toBe('John Doe');
    });

    it('should handle hyphenated names', () => {
      // Note: Current implementation treats hyphen as word separator
      // This may need adjustment based on requirements
      expect(capitalizeName('mary-jane')).toBe('Mary Jane');
    });
  });
});
