/**
 * Unit Tests for Security Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeInput,
  sanitizePhone,
  sanitizeEmail,
  sanitizeName,
  sanitizeZipCode,
  isRateLimited,
  getRateLimitRemaining,
  resetRateLimit,
  RATE_LIMITS,
  containsSuspiciousPatterns,
  generateSecureId,
  maskSensitiveData,
  maskPhone,
} from './security';

describe('sanitizeInput', () => {
  it('removes HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
    expect(sanitizeInput('<div>Hello</div>')).toBe('Hello');
    expect(sanitizeInput('<b>Bold</b> text')).toBe('Bold text');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
    expect(sanitizeInput('\n\ttest\n')).toBe('test');
  });

  it('handles non-string input', () => {
    expect(sanitizeInput(null as unknown as string)).toBe('');
    expect(sanitizeInput(undefined as unknown as string)).toBe('');
    expect(sanitizeInput(123 as unknown as string)).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
    expect(sanitizeInput('John Doe')).toBe('John Doe');
  });
});

describe('sanitizePhone', () => {
  it('extracts digits only', () => {
    expect(sanitizePhone('(555) 123-4567')).toBe('5551234567');
    expect(sanitizePhone('555.123.4567')).toBe('5551234567');
    expect(sanitizePhone('555 123 4567')).toBe('5551234567');
  });

  it('truncates to 10 digits', () => {
    expect(sanitizePhone('12345678901234')).toBe('1234567890');
  });

  it('handles non-string input', () => {
    expect(sanitizePhone(null as unknown as string)).toBe('');
    expect(sanitizePhone(123 as unknown as string)).toBe('');
  });

  it('handles empty input', () => {
    expect(sanitizePhone('')).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('converts to lowercase', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
  });

  it('trims whitespace', () => {
    expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
  });

  it('handles non-string input', () => {
    expect(sanitizeEmail(null as unknown as string)).toBe('');
    expect(sanitizeEmail(123 as unknown as string)).toBe('');
  });

  it('truncates long emails', () => {
    const longEmail = 'a'.repeat(300) + '@example.com';
    expect(sanitizeEmail(longEmail).length).toBeLessThanOrEqual(255);
  });
});

describe('sanitizeName', () => {
  it('allows letters, spaces, hyphens, and apostrophes', () => {
    expect(sanitizeName("O'Connor")).toBe("O'Connor");
    expect(sanitizeName('Mary-Jane')).toBe('Mary-Jane');
    expect(sanitizeName('John Doe')).toBe('John Doe');
  });

  it('removes numbers and special characters', () => {
    expect(sanitizeName('John123')).toBe('John');
    expect(sanitizeName('Test@#$')).toBe('Test');
  });

  it('truncates to 50 characters', () => {
    const longName = 'A'.repeat(100);
    expect(sanitizeName(longName).length).toBe(50);
  });

  it('handles non-string input', () => {
    expect(sanitizeName(null as unknown as string)).toBe('');
    expect(sanitizeName(123 as unknown as string)).toBe('');
  });
});

describe('sanitizeZipCode', () => {
  it('extracts digits only', () => {
    expect(sanitizeZipCode('12345')).toBe('12345');
    expect(sanitizeZipCode('12345-6789')).toBe('12345');
  });

  it('truncates to 5 digits', () => {
    expect(sanitizeZipCode('1234567890')).toBe('12345');
  });

  it('handles non-string input', () => {
    expect(sanitizeZipCode(null as unknown as string)).toBe('');
    expect(sanitizeZipCode(123 as unknown as string)).toBe('');
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    resetRateLimit('test-key');
  });

  describe('isRateLimited', () => {
    it('allows requests under the limit', () => {
      const config = { maxRequests: 3, windowMs: 60000 };
      expect(isRateLimited('test-key', config)).toBe(false);
      expect(isRateLimited('test-key', config)).toBe(false);
      expect(isRateLimited('test-key', config)).toBe(false);
    });

    it('blocks requests over the limit', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      expect(isRateLimited('test-key', config)).toBe(false);
      expect(isRateLimited('test-key', config)).toBe(false);
      expect(isRateLimited('test-key', config)).toBe(true);
      expect(isRateLimited('test-key', config)).toBe(true);
    });

    it('uses default config when not provided', () => {
      for (let i = 0; i < 10; i++) {
        expect(isRateLimited('test-default')).toBe(false);
      }
      expect(isRateLimited('test-default')).toBe(true);
    });

    it('resets after window expires', () => {
      vi.useFakeTimers();
      const config = { maxRequests: 1, windowMs: 1000 };
      
      expect(isRateLimited('test-reset', config)).toBe(false);
      expect(isRateLimited('test-reset', config)).toBe(true);
      
      vi.advanceTimersByTime(1001);
      
      expect(isRateLimited('test-reset', config)).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('getRateLimitRemaining', () => {
    it('returns max requests for new key', () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      expect(getRateLimitRemaining('fresh-key', config)).toBe(5);
    });

    it('decreases remaining after requests', () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      isRateLimited('remaining-key', config);
      isRateLimited('remaining-key', config);
      expect(getRateLimitRemaining('remaining-key', config)).toBe(3);
    });

    it('returns 0 when limit reached', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      isRateLimited('zero-key', config);
      isRateLimited('zero-key', config);
      expect(getRateLimitRemaining('zero-key', config)).toBe(0);
    });
  });

  describe('resetRateLimit', () => {
    it('clears rate limit state', () => {
      const config = { maxRequests: 1, windowMs: 60000 };
      isRateLimited('reset-key', config);
      expect(isRateLimited('reset-key', config)).toBe(true);
      
      resetRateLimit('reset-key');
      expect(isRateLimited('reset-key', config)).toBe(false);
    });
  });
});

describe('RATE_LIMITS', () => {
  it('defines all required rate limits', () => {
    expect(RATE_LIMITS.PHONE_LOOKUP).toEqual({ maxRequests: 5, windowMs: 30000 });
    expect(RATE_LIMITS.CLIENT_CREATE).toEqual({ maxRequests: 3, windowMs: 60000 });
    expect(RATE_LIMITS.CHECKIN_CREATE).toEqual({ maxRequests: 5, windowMs: 60000 });
    expect(RATE_LIMITS.QR_SCAN).toEqual({ maxRequests: 10, windowMs: 30000 });
    expect(RATE_LIMITS.HELP_REQUEST).toEqual({ maxRequests: 3, windowMs: 60000 });
  });
});

describe('containsSuspiciousPatterns', () => {
  it('detects script tags', () => {
    expect(containsSuspiciousPatterns('<script>')).toBe(true);
    expect(containsSuspiciousPatterns('<script src="malicious.js">')).toBe(true);
  });

  it('detects javascript: protocol', () => {
    expect(containsSuspiciousPatterns('javascript:alert(1)')).toBe(true);
  });

  it('detects event handlers', () => {
    expect(containsSuspiciousPatterns('onclick=alert(1)')).toBe(true);
    expect(containsSuspiciousPatterns('onerror=malicious()')).toBe(true);
  });

  it('detects data: protocol', () => {
    expect(containsSuspiciousPatterns('data:text/html,<script>')).toBe(true);
  });

  it('detects vbscript: protocol', () => {
    expect(containsSuspiciousPatterns('vbscript:msgbox(1)')).toBe(true);
  });

  it('detects CSS expression', () => {
    expect(containsSuspiciousPatterns('expression(alert(1))')).toBe(true);
  });

  it('returns false for normal input', () => {
    expect(containsSuspiciousPatterns('John Doe')).toBe(false);
    expect(containsSuspiciousPatterns('test@example.com')).toBe(false);
    expect(containsSuspiciousPatterns('Hello World!')).toBe(false);
  });

  it('handles non-string input', () => {
    expect(containsSuspiciousPatterns(null as unknown as string)).toBe(false);
    expect(containsSuspiciousPatterns(123 as unknown as string)).toBe(false);
  });
});

describe('generateSecureId', () => {
  it('generates a hex string of default length', () => {
    const id = generateSecureId();
    expect(id).toMatch(/^[0-9a-f]+$/);
    expect(id.length).toBe(32); // 16 bytes = 32 hex chars
  });

  it('generates a hex string of specified length', () => {
    const id = generateSecureId(8);
    expect(id.length).toBe(16); // 8 bytes = 16 hex chars
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateSecureId()));
    expect(ids.size).toBe(100);
  });
});

describe('maskSensitiveData', () => {
  it('masks data keeping first 4 characters', () => {
    expect(maskSensitiveData('1234567890')).toBe('1234******');
  });

  it('masks data with custom visible characters', () => {
    expect(maskSensitiveData('1234567890', 2)).toBe('12********');
  });

  it('returns *** for short data', () => {
    expect(maskSensitiveData('abc')).toBe('***');
    expect(maskSensitiveData('ab', 4)).toBe('***');
  });

  it('handles empty string', () => {
    expect(maskSensitiveData('')).toBe('***');
  });

  it('handles null/undefined', () => {
    expect(maskSensitiveData(null as unknown as string)).toBe('***');
    expect(maskSensitiveData(undefined as unknown as string)).toBe('***');
  });
});

describe('maskPhone', () => {
  it('masks phone number showing last 2 digits', () => {
    expect(maskPhone('5551234567')).toBe('(***) ***-**67');
    expect(maskPhone('(555) 123-4567')).toBe('(***) ***-**67');
  });

  it('handles short phone numbers', () => {
    expect(maskPhone('123')).toBe('***-****');
  });

  it('handles empty phone', () => {
    expect(maskPhone('')).toBe('***-****');
  });
});
