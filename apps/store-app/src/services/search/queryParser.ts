/**
 * Query Parser for Global Search
 *
 * Parses search queries to detect:
 * - Prefixes (#, @, $, date:, staff:, status:, service:)
 * - Phone number patterns
 * - Date filters
 * - Amount filters
 */

import type { ParsedQuery, SearchPrefix, DateFilter, AmountFilter } from './types';
import { PREFIX_CONFIG } from './types';
import { isPhoneQuery, extractPhoneDigits, normalizeText } from './fuzzyMatcher';

// ============================================================================
// Prefix Detection
// ============================================================================

/**
 * Detect if query starts with a known prefix
 *
 * @param query - Raw search query
 * @returns Detected prefix or empty string
 */
export function detectPrefix(query: string): SearchPrefix {
  const trimmed = query.trim();

  // Check single-character prefixes first
  if (trimmed.startsWith('#')) return '#';
  if (trimmed.startsWith('@')) return '@';
  if (trimmed.startsWith('$')) return '$';

  // Check word prefixes (case-insensitive)
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('date:')) return 'date:';
  if (lower.startsWith('staff:')) return 'staff:';
  if (lower.startsWith('status:')) return 'status:';
  if (lower.startsWith('service:')) return 'service:';
  if (lower.startsWith('set:')) return 'set:';
  if (lower.startsWith('go:')) return 'go:';

  return '';
}

/**
 * Remove prefix from query string
 *
 * @param query - Query with prefix
 * @param prefix - Prefix to remove
 * @returns Query without prefix
 */
export function removePrefix(query: string, prefix: SearchPrefix): string {
  if (!prefix) return query.trim();

  const trimmed = query.trim();

  // Single character prefixes
  if (prefix.length === 1 && trimmed.startsWith(prefix)) {
    return trimmed.substring(1).trim();
  }

  // Word prefixes (case-insensitive removal)
  const lower = trimmed.toLowerCase();
  if (lower.startsWith(prefix)) {
    return trimmed.substring(prefix.length).trim();
  }

  return trimmed;
}

// ============================================================================
// Date Parsing
// ============================================================================

/**
 * Parse a date filter string
 *
 * Supports:
 * - "today" / "now"
 * - "tomorrow"
 * - "yesterday"
 * - "week" / "this week"
 * - "month" / "this month"
 * - Specific dates: "2024-01-15", "01/15/2024", "Jan 15"
 *
 * @param dateStr - Date filter string
 * @returns Parsed date filter
 */
export function parseDateFilter(dateStr: string): DateFilter {
  const normalized = dateStr.toLowerCase().trim();
  const now = new Date();

  // Today
  if (normalized === 'today' || normalized === 'now' || normalized === '') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { type: 'today', start, end };
  }

  // Tomorrow
  if (normalized === 'tomorrow') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { type: 'tomorrow', start, end };
  }

  // Yesterday
  if (normalized === 'yesterday') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { type: 'custom', start, end };
  }

  // This week
  if (normalized === 'week' || normalized === 'this week') {
    const dayOfWeek = now.getDay();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { type: 'week', start, end };
  }

  // This month
  if (normalized === 'month' || normalized === 'this month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { type: 'month', start, end };
  }

  // Try to parse specific date formats
  const parsed = tryParseDate(dateStr);
  if (parsed) {
    const start = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { type: 'custom', start, end };
  }

  // Default to today if unparseable
  return parseDateFilter('today');
}

/**
 * Try to parse various date formats
 *
 * @param dateStr - Date string
 * @returns Parsed date or null
 */
function tryParseDate(dateStr: string): Date | null {
  // Try ISO format (YYYY-MM-DD)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try US format (MM/DD/YYYY or M/D/YYYY)
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try short US format (MM/DD or M/D) - assume current year
  const shortUsMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (shortUsMatch) {
    const [, month, day] = shortUsMatch;
    const date = new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }

  // Try month name format (Jan 15, January 15)
  const monthNames = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  const monthNameMatch = dateStr.toLowerCase().match(/^([a-z]+)\s*(\d{1,2})$/);
  if (monthNameMatch) {
    const [, monthName, day] = monthNameMatch;
    const monthIndex = monthNames.findIndex(m => monthName.startsWith(m));
    if (monthIndex !== -1) {
      const date = new Date(new Date().getFullYear(), monthIndex, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

// ============================================================================
// Amount Parsing
// ============================================================================

/**
 * Parse an amount filter string
 *
 * Supports:
 * - Single value: "50" → { min: 45, max: 55 } (±10%)
 * - Range: "50-100" → { min: 50, max: 100 }
 * - Greater than: ">50" or "50+" → { min: 50, max: Infinity }
 * - Less than: "<50" → { min: 0, max: 50 }
 *
 * @param amountStr - Amount filter string
 * @returns Parsed amount filter
 */
export function parseAmountFilter(amountStr: string): AmountFilter | undefined {
  const normalized = amountStr.trim().replace(/,/g, '');

  // Range format: "50-100"
  const rangeMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const [, minStr, maxStr] = rangeMatch;
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);
    if (!isNaN(min) && !isNaN(max)) {
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
  }

  // Greater than: ">50" or "50+"
  const gtMatch = normalized.match(/^(?:>|>=?)\s*(\d+(?:\.\d+)?)$/) ||
                  normalized.match(/^(\d+(?:\.\d+)?)\s*\+$/);
  if (gtMatch) {
    const min = parseFloat(gtMatch[1]);
    if (!isNaN(min)) {
      return { min, max: Number.MAX_SAFE_INTEGER };
    }
  }

  // Less than: "<50"
  const ltMatch = normalized.match(/^(?:<|<=?)\s*(\d+(?:\.\d+)?)$/);
  if (ltMatch) {
    const max = parseFloat(ltMatch[1]);
    if (!isNaN(max)) {
      return { min: 0, max };
    }
  }

  // Single value: "50" → fuzzy range (±10% or ±5, whichever is greater)
  const singleMatch = normalized.match(/^(\d+(?:\.\d+)?)$/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    if (!isNaN(value)) {
      const tolerance = Math.max(value * 0.1, 5);
      return { min: Math.max(0, value - tolerance), max: value + tolerance };
    }
  }

  return undefined;
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse a search query into structured components
 *
 * @param input - Raw search query
 * @returns Parsed query object
 */
export function parseSearchQuery(input: string): ParsedQuery {
  const trimmed = input.trim();

  // Detect prefix
  const prefix = detectPrefix(trimmed);
  const queryWithoutPrefix = removePrefix(trimmed, prefix);
  const normalizedQuery = normalizeText(queryWithoutPrefix);

  // Check for phone number pattern
  const phoneSearch = isPhoneQuery(queryWithoutPrefix);
  const phoneDigits = phoneSearch ? extractPhoneDigits(queryWithoutPrefix) : undefined;

  // Base parsed query
  const parsed: ParsedQuery = {
    type: prefix ? 'prefix' : 'general',
    prefix,
    rawQuery: trimmed,
    normalizedQuery,
    isPhoneSearch: phoneSearch,
    phoneDigits,
  };

  // Parse prefix-specific filters
  switch (prefix) {
    case '$':
      parsed.amountFilter = parseAmountFilter(queryWithoutPrefix);
      break;
    case 'date:':
      parsed.dateFilter = parseDateFilter(queryWithoutPrefix);
      break;
    case 'status:':
      parsed.statusFilter = normalizedQuery;
      break;
  }

  return parsed;
}

/**
 * Get suggested prefixes for autocomplete
 *
 * @param partialInput - Partial input that might be a prefix
 * @returns Array of matching prefix suggestions
 */
export function getSuggestedPrefixes(
  partialInput: string
): Array<{ prefix: SearchPrefix; label: string; description: string }> {
  const lower = partialInput.toLowerCase().trim();

  if (!lower || lower.length > 10) return [];

  const suggestions: Array<{ prefix: SearchPrefix; label: string; description: string }> = [];

  for (const [prefix, config] of Object.entries(PREFIX_CONFIG)) {
    if (prefix === '') continue; // Skip empty prefix

    // Check if partial input matches the prefix
    const prefixLower = prefix.toLowerCase();
    if (prefixLower.startsWith(lower) || config.label.toLowerCase().startsWith(lower)) {
      suggestions.push({
        prefix: prefix as SearchPrefix,
        label: config.label,
        description: config.description,
      });
    }
  }

  return suggestions;
}

/**
 * Check if query is valid for searching
 *
 * @param query - Search query
 * @returns True if query is searchable
 */
export function isValidSearchQuery(query: string): boolean {
  const trimmed = query.trim();

  // Need at least 2 characters (or 3 for phone)
  if (trimmed.length < 2) return false;

  // If it's just a prefix with no content, not valid
  const prefix = detectPrefix(trimmed);
  const content = removePrefix(trimmed, prefix);
  if (prefix && content.length === 0) return false;

  // For phone searches, need at least 3 digits
  if (isPhoneQuery(content) && extractPhoneDigits(content).length < 3) return false;

  return true;
}

/**
 * Format a query for display (e.g., in recent searches)
 *
 * @param query - Raw query
 * @returns Formatted display string
 */
export function formatQueryForDisplay(query: string): string {
  const parsed = parseSearchQuery(query);

  if (!parsed.prefix) {
    return parsed.normalizedQuery;
  }

  // Format with prefix indicator
  const prefixConfig = PREFIX_CONFIG[parsed.prefix];
  return `${prefixConfig.label}: ${parsed.normalizedQuery}`;
}
