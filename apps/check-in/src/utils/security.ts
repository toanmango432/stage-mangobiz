/**
 * Security Utilities
 * 
 * Provides security-related functions for input sanitization, validation,
 * and rate limiting.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks.
 * Uses DOMPurify with strict configuration.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Use DOMPurify for HTML sanitization
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed in form inputs
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Trim whitespace
  return sanitized.trim();
}

/**
 * Sanitize phone number - only allow digits
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/\D/g, '').slice(0, 10);
}

/**
 * Sanitize email - basic sanitization
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  return sanitizeInput(input).toLowerCase().slice(0, 255);
}

/**
 * Sanitize name - remove special characters that could be dangerous
 */
export function sanitizeName(input: string): string {
  if (typeof input !== 'string') return '';
  // Allow letters, spaces, hyphens, apostrophes (for names like O'Connor, Mary-Jane)
  const sanitized = sanitizeInput(input);
  return sanitized.replace(/[^a-zA-Z\s\-']/g, '').slice(0, 50);
}

/**
 * Sanitize zip code - only allow digits
 */
export function sanitizeZipCode(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/\D/g, '').slice(0, 5);
}

/**
 * Rate limiter for API calls
 */
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

const rateLimiters = new Map<string, RateLimitState>();

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
};

/**
 * Check if an action is rate limited.
 * Returns true if the action should be blocked.
 */
export function isRateLimited(
  key: string, 
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): boolean {
  const now = Date.now();
  const state = rateLimiters.get(key);
  
  if (!state || now >= state.resetTime) {
    // Reset the window
    rateLimiters.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }
  
  if (state.count >= config.maxRequests) {
    return true;
  }
  
  state.count++;
  return false;
}

/**
 * Get remaining requests for a rate limit key
 */
export function getRateLimitRemaining(
  key: string, 
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): number {
  const now = Date.now();
  const state = rateLimiters.get(key);
  
  if (!state || now >= state.resetTime) {
    return config.maxRequests;
  }
  
  return Math.max(0, config.maxRequests - state.count);
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimiters.delete(key);
}

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  PHONE_LOOKUP: { maxRequests: 5, windowMs: 30000 }, // 5 per 30 seconds
  CLIENT_CREATE: { maxRequests: 3, windowMs: 60000 }, // 3 per minute
  CHECKIN_CREATE: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  QR_SCAN: { maxRequests: 10, windowMs: 30000 }, // 10 per 30 seconds
  HELP_REQUEST: { maxRequests: 3, windowMs: 60000 }, // 3 per minute
} as const;

/**
 * Validate input against injection patterns
 */
export function containsSuspiciousPatterns(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /data:/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Secure logger that only logs in development
 */
export const secureLog = {
  debug: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    // Always log errors, but redact sensitive info in production
    if (import.meta.env.DEV) {
      console.error(...args);
    } else {
      // In production, log without sensitive data
      const sanitizedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return '[Object]';
        }
        return arg;
      });
      console.error(...sanitizedArgs);
    }
  },
};

/**
 * Validate that environment is properly configured
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is not configured');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured');
  }
  
  // Check for placeholder values
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (url && url.includes('placeholder')) {
    errors.push('VITE_SUPABASE_URL contains placeholder value');
  }
  
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (key && key.includes('placeholder')) {
    errors.push('VITE_SUPABASE_ANON_KEY contains placeholder value');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random string
 */
export function generateSecureId(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars) {
    return '***';
  }
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

/**
 * Mask phone number for display (e.g., (555) ***-**12)
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***-****';
  const lastFour = digits.slice(-2);
  return `(***) ***-**${lastFour}`;
}
