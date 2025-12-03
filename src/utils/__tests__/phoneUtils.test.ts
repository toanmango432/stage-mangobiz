/**
 * Phone Utils Test Suite
 * Testing phone number formatting and validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatPhoneNumber,
  cleanPhoneNumber,
  isValidPhoneNumber,
  formatPhoneDisplay,
  formatInternationalPhone,
  handlePhoneInput,
} from '../phoneUtils';

describe('phoneUtils', () => {
  describe('formatPhoneNumber', () => {
    it('should format 10 digits to (xxx) xxx-xxxx', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('9999999999')).toBe('(999) 999-9999');
    });

    it('should handle partial phone numbers gracefully', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber('5')).toBe('5');
      expect(formatPhoneNumber('55')).toBe('55');
      expect(formatPhoneNumber('555')).toBe('555');
    });

    it('should format (area) only for 1-3 digits', () => {
      expect(formatPhoneNumber('5')).toBe('5');
      expect(formatPhoneNumber('55')).toBe('55');
      expect(formatPhoneNumber('555')).toBe('555');
    });

    it('should format (area) prefix for 4-6 digits', () => {
      expect(formatPhoneNumber('5551')).toBe('(555) 1');
      expect(formatPhoneNumber('55512')).toBe('(555) 12');
      expect(formatPhoneNumber('555123')).toBe('(555) 123');
    });

    it('should strip non-digit characters before formatting', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('+1 555 123 4567')).toBe('(555) 123-4567'); // Strips +1 country code
    });

    it('should return empty string for empty input', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber('   ')).toBe('');
    });

    it('should handle special characters and letters', () => {
      expect(formatPhoneNumber('abc555def123ghi4567')).toBe('(555) 123-4567');
      expect(formatPhoneNumber('!@#$%5551234567')).toBe('(555) 123-4567');
    });
  });

  describe('cleanPhoneNumber', () => {
    it('should remove all non-digit characters', () => {
      expect(cleanPhoneNumber('(555) 123-4567')).toBe('5551234567');
      expect(cleanPhoneNumber('555.123.4567')).toBe('5551234567');
      expect(cleanPhoneNumber('555-123-4567')).toBe('5551234567');
      expect(cleanPhoneNumber('+1 555 123 4567')).toBe('15551234567');
    });

    it('should handle formatted numbers', () => {
      expect(cleanPhoneNumber('(555) 123-4567')).toBe('5551234567');
      expect(cleanPhoneNumber('555 123 4567')).toBe('5551234567');
    });

    it('should handle international format', () => {
      expect(cleanPhoneNumber('+1 555 123 4567')).toBe('15551234567');
      expect(cleanPhoneNumber('+44 20 1234 5678')).toBe('442012345678');
    });

    it('should handle empty input', () => {
      expect(cleanPhoneNumber('')).toBe('');
      expect(cleanPhoneNumber('   ')).toBe('');
    });

    it('should handle text mixed with numbers', () => {
      expect(cleanPhoneNumber('Call me at 555-123-4567')).toBe('5551234567');
      expect(cleanPhoneNumber('Phone: (555) 123-4567')).toBe('5551234567');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should return true for 10-digit numbers', () => {
      expect(isValidPhoneNumber('5551234567')).toBe(true);
      expect(isValidPhoneNumber('1234567890')).toBe(true);
      expect(isValidPhoneNumber('9999999999')).toBe(true);
    });

    it('should return false for < 10 digits', () => {
      expect(isValidPhoneNumber('555123456')).toBe(false);
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
    });

    it('should return false for > 10 digits', () => {
      expect(isValidPhoneNumber('55512345678')).toBe(false);
      expect(isValidPhoneNumber('123456789012')).toBe(false);
    });

    it('should handle formatted input', () => {
      expect(isValidPhoneNumber('(555) 123-4567')).toBe(true);
      expect(isValidPhoneNumber('555-123-4567')).toBe(true);
      expect(isValidPhoneNumber('555.123.4567')).toBe(true);
    });

    it('should handle invalid formats', () => {
      expect(isValidPhoneNumber('(555) 123-456')).toBe(false); // 9 digits
      expect(isValidPhoneNumber('555-1234-5678')).toBe(false); // 11 digits
    });

    it('should handle non-US numbers as invalid', () => {
      expect(isValidPhoneNumber('+1 555 123 4567')).toBe(false); // Has +1
      expect(isValidPhoneNumber('44 20 1234 5678')).toBe(false); // UK format
    });
  });

  describe('formatPhoneDisplay', () => {
    it('should format complete numbers', () => {
      expect(formatPhoneDisplay('5551234567')).toBe('(555) 123-4567');
    });

    it('should handle partial numbers without errors', () => {
      expect(formatPhoneDisplay('')).toBe('');
      expect(formatPhoneDisplay('5')).toBe('5');
      expect(formatPhoneDisplay('55')).toBe('55');
      expect(formatPhoneDisplay('555')).toBe('555');
      expect(formatPhoneDisplay('5551')).toBe('(555) 1');
      expect(formatPhoneDisplay('555123')).toBe('(555) 123');
    });

    it('should show progressive formatting', () => {
      expect(formatPhoneDisplay('5')).toBe('5');
      expect(formatPhoneDisplay('55')).toBe('55');
      expect(formatPhoneDisplay('555')).toBe('555');
      expect(formatPhoneDisplay('5551')).toBe('(555) 1');
      expect(formatPhoneDisplay('55512')).toBe('(555) 12');
      expect(formatPhoneDisplay('555123')).toBe('(555) 123');
      expect(formatPhoneDisplay('5551234')).toBe('(555) 123-4');
      expect(formatPhoneDisplay('55512345')).toBe('(555) 123-45');
      expect(formatPhoneDisplay('555123456')).toBe('(555) 123-456');
      expect(formatPhoneDisplay('5551234567')).toBe('(555) 123-4567');
    });

    it('should handle already formatted numbers', () => {
      expect(formatPhoneDisplay('(555) 123-4567')).toBe('(555) 123-4567');
    });
  });

  describe('formatInternationalPhone', () => {
    it('should add +1 country code by default', () => {
      expect(formatInternationalPhone('5551234567')).toBe('+1 555 123 4567');
    });

    it('should accept custom country code', () => {
      expect(formatInternationalPhone('5551234567', '+44')).toBe('+44 555 123 4567');
      expect(formatInternationalPhone('5551234567', '+33')).toBe('+33 555 123 4567');
      expect(formatInternationalPhone('5551234567', '+49')).toBe('+49 555 123 4567');
    });

    it('should format with spaces', () => {
      expect(formatInternationalPhone('1234567890')).toBe('+1 123 456 7890');
      expect(formatInternationalPhone('9999999999')).toBe('+1 999 999 9999');
    });

    it('should handle formatted input', () => {
      expect(formatInternationalPhone('(555) 123-4567')).toBe('+1 555 123 4567');
    });

    it('should return original value for invalid phone numbers', () => {
      expect(formatInternationalPhone('123')).toBe('123');
      expect(formatInternationalPhone('55512345678')).toBe('55512345678');
      expect(formatInternationalPhone('')).toBe('');
    });
  });

  describe('handlePhoneInput', () => {
    it('should format input event value', () => {
      const event = { target: { value: '5551234567' } } as React.ChangeEvent<HTMLInputElement>;
      expect(handlePhoneInput(event)).toBe('(555) 123-4567');
    });

    it('should limit to 10 digits', () => {
      const event = { target: { value: '55512345678' } } as React.ChangeEvent<HTMLInputElement>;
      expect(handlePhoneInput(event)).toBe('(555) 123-4567');

      const event2 = { target: { value: '123456789012345' } } as React.ChangeEvent<HTMLInputElement>;
      expect(handlePhoneInput(event2)).toBe('(123) 456-7890');
    });

    it('should handle paste events', () => {
      const event = { target: { value: 'Phone: (555) 123-4567' } } as React.ChangeEvent<HTMLInputElement>;
      expect(handlePhoneInput(event)).toBe('(555) 123-4567');
    });

    it('should handle partial input', () => {
      const event1 = { target: { value: '555' } } as React.ChangeEvent<HTMLInputElement>;
      expect(handlePhoneInput(event1)).toBe('555');

      const event2 = { target: { value: '555123' } } as React.ChangeEvent<HTMLInputElement>;
      expect(handlePhoneInput(event2)).toBe('(555) 123');
    });

    it('should handle clearing input', () => {
      const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
      expect(handlePhoneInput(event)).toBe('');
    });

    it('should handle special characters in input', () => {
      const event = { target: { value: '(555) 123-' } } as React.ChangeEvent<HTMLInputElement>;
      expect(handlePhoneInput(event)).toBe('(555) 123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined gracefully', () => {
      expect(() => formatPhoneNumber(null as any)).not.toThrow();
      expect(() => formatPhoneNumber(undefined as any)).not.toThrow();
      expect(formatPhoneNumber(null as any)).toBe('');
      expect(formatPhoneNumber(undefined as any)).toBe('');
    });

    it('should handle numbers as input', () => {
      expect(formatPhoneNumber(5551234567 as any)).toBe('(555) 123-4567');
    });

    it('should handle very long strings', () => {
      const longString = '5'.repeat(100);
      expect(handlePhoneInput({ target: { value: longString } } as any)).toBe('(555) 555-5555');
    });

    it('should handle international prefixes correctly', () => {
      expect(cleanPhoneNumber('011 44 20 1234 5678')).toBe('011442012345678');
      expect(cleanPhoneNumber('00 44 20 1234 5678')).toBe('00442012345678');
    });
  });
});