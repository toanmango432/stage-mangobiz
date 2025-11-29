/**
 * License Key Generator
 * Generates secure, unique license keys in the format: XXXX-XXXX-XXXX-XXXX
 */

// Characters used for license key generation (no ambiguous characters like 0/O, 1/I/l)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a random segment of the license key
 */
function generateSegment(length: number = 4): string {
  let segment = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    segment += CHARSET[array[i] % CHARSET.length];
  }

  return segment;
}

/**
 * Generate a license key in format: XXXX-XXXX-XXXX-XXXX
 * Uses cryptographically secure random values
 */
export function generateLicenseKey(): string {
  const segments = [
    generateSegment(4),
    generateSegment(4),
    generateSegment(4),
    generateSegment(4),
  ];

  return segments.join('-');
}

/**
 * Validate license key format
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  // Pattern: XXXX-XXXX-XXXX-XXXX where X is uppercase letter or digit (excluding ambiguous chars)
  const pattern = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
  return pattern.test(key);
}

/**
 * Normalize license key (uppercase, proper format)
 */
export function normalizeLicenseKey(key: string): string {
  // Remove all non-alphanumeric characters and uppercase
  const cleaned = key.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // If it's 16 characters, format it properly
  if (cleaned.length === 16) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}`;
  }

  // Otherwise return as-is (might be invalid)
  return key.toUpperCase();
}

/**
 * Generate multiple license keys at once
 */
export function generateBulkLicenseKeys(count: number): string[] {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    keys.push(generateLicenseKey());
  }
  return keys;
}

/**
 * Generate a license key with a checksum segment for additional validation
 * Format: XXXX-XXXX-XXXX-CCCC (last segment is derived checksum)
 */
export function generateLicenseKeyWithChecksum(): string {
  const segments = [
    generateSegment(4),
    generateSegment(4),
    generateSegment(4),
  ];

  // Simple checksum: XOR all characters and map to charset
  const combined = segments.join('');
  let checksum = 0;
  for (let i = 0; i < combined.length; i++) {
    checksum = (checksum + combined.charCodeAt(i)) % CHARSET.length;
  }

  // Generate checksum segment based on combined hash
  let checksumSegment = '';
  let hash = checksum;
  for (let i = 0; i < 4; i++) {
    checksumSegment += CHARSET[(hash + i * 7) % CHARSET.length];
    hash = (hash * 31 + combined.charCodeAt(i % combined.length)) % CHARSET.length;
  }

  return [...segments, checksumSegment].join('-');
}

/**
 * Verify a license key with checksum
 */
export function verifyLicenseKeyChecksum(key: string): boolean {
  if (!isValidLicenseKeyFormat(key)) return false;

  const segments = key.split('-');
  const dataSegments = segments.slice(0, 3);
  const providedChecksum = segments[3];

  // Recalculate checksum
  const combined = dataSegments.join('');
  let checksum = 0;
  for (let i = 0; i < combined.length; i++) {
    checksum = (checksum + combined.charCodeAt(i)) % CHARSET.length;
  }

  let expectedChecksum = '';
  let hash = checksum;
  for (let i = 0; i < 4; i++) {
    expectedChecksum += CHARSET[(hash + i * 7) % CHARSET.length];
    hash = (hash * 31 + combined.charCodeAt(i % combined.length)) % CHARSET.length;
  }

  return providedChecksum === expectedChecksum;
}
