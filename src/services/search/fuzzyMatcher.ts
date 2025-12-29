/**
 * Fuzzy Matching Algorithm for Global Search
 *
 * Uses Levenshtein distance for typo tolerance with optimizations:
 * - Single-row memory optimization
 * - Early exit for exact matches
 * - Position bonus for prefix matches
 * - Phone number normalization
 */

import type { FuzzyMatchOptions, FuzzyMatchResult } from './types';
import { DEFAULT_FUZZY_OPTIONS } from './types';

// ============================================================================
// Levenshtein Distance
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Uses single-row optimization for memory efficiency
 *
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance (number of insertions, deletions, substitutions)
 */
export function levenshteinDistance(a: string, b: string): number {
  // Early exits
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for memory efficiency
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const aLen = a.length;
  const bLen = b.length;

  // Single row optimization (instead of full matrix)
  // We only need the previous row to calculate the current row
  let prevRow = Array.from({ length: aLen + 1 }, (_, i) => i);
  let currRow = new Array<number>(aLen + 1);

  for (let j = 1; j <= bLen; j++) {
    currRow[0] = j;

    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,      // deletion
        currRow[i - 1] + 1,  // insertion
        prevRow[i - 1] + cost // substitution
      );
    }

    // Swap rows
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[aLen];
}

// ============================================================================
// Fuzzy Matching
// ============================================================================

/**
 * Perform fuzzy matching between query and target
 *
 * @param query - Search query
 * @param target - Target string to match against
 * @param options - Matching options
 * @returns Match result with score
 */
export function fuzzyMatch(
  query: string,
  target: string,
  options: FuzzyMatchOptions = {}
): FuzzyMatchResult {
  const opts = { ...DEFAULT_FUZZY_OPTIONS, ...options };

  // Normalize if case insensitive
  const q = opts.caseSensitive ? query.trim() : query.trim().toLowerCase();
  const t = opts.caseSensitive ? target.trim() : target.trim().toLowerCase();

  // Handle empty strings
  if (q.length === 0 || t.length === 0) {
    return { isMatch: false, score: 0 };
  }

  // Exact match = perfect score
  if (q === t) {
    return { isMatch: true, score: 1.0, matchedPortion: target };
  }

  // Prefix match = high score with bonus
  if (t.startsWith(q)) {
    const baseScore = q.length / t.length;
    const score = Math.min(1.0, baseScore + opts.prefixBoost);
    return { isMatch: true, score, matchedPortion: target.substring(0, q.length) };
  }

  // Substring match = good score
  const substringIndex = t.indexOf(q);
  if (substringIndex !== -1) {
    // Score based on position (earlier is better) and coverage
    const positionFactor = 1 - (substringIndex / t.length) * 0.2;
    const coverageFactor = q.length / t.length;
    const score = Math.min(0.95, coverageFactor * positionFactor);
    return {
      isMatch: true,
      score,
      matchedPortion: target.substring(substringIndex, substringIndex + q.length),
    };
  }

  // Word boundary match (query matches start of a word in target)
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) {
      const score = Math.min(0.9, (q.length / word.length) * 0.85 + opts.prefixBoost);
      return { isMatch: true, score, matchedPortion: word };
    }
  }

  // Fuzzy match using Levenshtein distance
  // Only worth computing if query and target are somewhat similar in length
  // Be more lenient for short queries (common in settings search)
  const lengthRatio = q.length / t.length;
  const minRatio = q.length <= 4 ? 0.15 : 0.25;
  if (lengthRatio < minRatio || lengthRatio > 4) {
    // Too different in length to be a reasonable fuzzy match
    return { isMatch: false, score: 0 };
  }

  const distance = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);
  const similarity = 1 - distance / maxLen;

  // Apply penalty for longer edits
  const normalizedScore = similarity * (1 - distance * 0.05);
  const score = Math.max(0, normalizedScore);

  return {
    isMatch: score >= opts.threshold,
    score,
    matchedPortion: score >= opts.threshold ? target : undefined,
  };
}

/**
 * Find the best fuzzy match among multiple targets
 *
 * @param query - Search query
 * @param targets - Array of target strings
 * @param options - Matching options
 * @returns Best match result with index, or null if no match
 */
export function findBestMatch(
  query: string,
  targets: string[],
  options: FuzzyMatchOptions = {}
): { index: number; target: string; result: FuzzyMatchResult } | null {
  let bestIndex = -1;
  let bestScore = 0;
  let bestResult: FuzzyMatchResult | null = null;

  for (let i = 0; i < targets.length; i++) {
    const result = fuzzyMatch(query, targets[i], options);
    if (result.isMatch && result.score > bestScore) {
      bestIndex = i;
      bestScore = result.score;
      bestResult = result;
    }
  }

  if (bestIndex === -1 || !bestResult) {
    return null;
  }

  return {
    index: bestIndex,
    target: targets[bestIndex],
    result: bestResult,
  };
}

/**
 * Match query against multiple fields and return the best match
 *
 * @param query - Search query
 * @param fields - Object with field names and values
 * @param options - Matching options
 * @returns Best match with field name and result
 */
export function matchFields(
  query: string,
  fields: Record<string, string | undefined>,
  options: FuzzyMatchOptions = {}
): { field: string; value: string; result: FuzzyMatchResult } | null {
  let bestField: string | null = null;
  let bestValue: string | null = null;
  let bestResult: FuzzyMatchResult | null = null;
  let bestScore = 0;

  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;

    const result = fuzzyMatch(query, value, options);
    if (result.isMatch && result.score > bestScore) {
      bestField = field;
      bestValue = value;
      bestResult = result;
      bestScore = result.score;
    }
  }

  if (!bestField || !bestValue || !bestResult) {
    return null;
  }

  return {
    field: bestField,
    value: bestValue,
    result: bestResult,
  };
}

// ============================================================================
// Phone Number Matching
// ============================================================================

/**
 * Normalize a phone number to digits only
 *
 * @param phone - Phone number in any format
 * @returns Digits only string
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Remove country code prefix (1 for US) if present and number is 11 digits
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }

  return digits;
}

/**
 * Check if a query matches a phone number (partial match supported)
 *
 * @param query - Search query (can be partial digits)
 * @param phone - Full phone number
 * @returns Match result
 */
export function matchPhone(
  query: string,
  phone: string
): FuzzyMatchResult {
  const normalizedQuery = normalizePhone(query);
  const normalizedPhone = normalizePhone(phone);

  // Need at least 3 digits for phone search
  if (normalizedQuery.length < 3) {
    return { isMatch: false, score: 0 };
  }

  // Exact match
  if (normalizedQuery === normalizedPhone) {
    return { isMatch: true, score: 1.0, matchedPortion: phone };
  }

  // Prefix match (e.g., area code)
  if (normalizedPhone.startsWith(normalizedQuery)) {
    const score = 0.9 + (normalizedQuery.length / normalizedPhone.length) * 0.1;
    return { isMatch: true, score, matchedPortion: phone };
  }

  // Suffix match (e.g., last 4 digits)
  if (normalizedPhone.endsWith(normalizedQuery)) {
    const score = 0.85 + (normalizedQuery.length / normalizedPhone.length) * 0.1;
    return { isMatch: true, score, matchedPortion: phone };
  }

  // Contains match
  if (normalizedPhone.includes(normalizedQuery)) {
    const score = 0.7 + (normalizedQuery.length / normalizedPhone.length) * 0.2;
    return { isMatch: true, score, matchedPortion: phone };
  }

  return { isMatch: false, score: 0 };
}

// ============================================================================
// Text Utilities
// ============================================================================

/**
 * Normalize text for search (lowercase, remove extra whitespace)
 *
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Tokenize text into searchable words
 *
 * @param text - Text to tokenize
 * @returns Array of tokens
 */
export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Check if query looks like a phone number
 *
 * @param query - Search query
 * @returns True if query appears to be a phone number search
 */
export function isPhoneQuery(query: string): boolean {
  const digits = query.replace(/\D/g, '');
  // Consider it a phone search if:
  // - Has 3+ digits
  // - Query is primarily digits (>50% digits)
  return digits.length >= 3 && digits.length / query.replace(/\s/g, '').length > 0.5;
}

/**
 * Extract phone digits from query
 *
 * @param query - Search query
 * @returns Extracted digits
 */
export function extractPhoneDigits(query: string): string {
  return query.replace(/\D/g, '');
}
