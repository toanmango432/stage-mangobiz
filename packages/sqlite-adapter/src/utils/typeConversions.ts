/**
 * Type-safe conversion utilities for SQLite ↔ JavaScript type mapping.
 *
 * These utilities handle the fundamental type mismatches between SQLite and JavaScript:
 * - SQLite has no boolean type (uses INTEGER 0/1)
 * - SQLite has no native date type (uses TEXT in ISO format)
 * - SQLite has no native JSON type (uses TEXT)
 *
 * @module sqlite-adapter/utils/typeConversions
 */

/**
 * Convert a value to ISO 8601 date string for SQLite storage.
 *
 * SQLite stores dates as TEXT in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).
 * This ensures consistent date comparisons using string ordering.
 *
 * @param value - Date object, ISO string, or other value to convert
 * @returns ISO 8601 string, or null if value is null/undefined/invalid
 *
 * @example
 * toISOString(new Date('2024-01-15')) // '2024-01-15T00:00:00.000Z'
 * toISOString('2024-01-15T12:00:00Z') // '2024-01-15T12:00:00.000Z'
 * toISOString(null) // null
 * toISOString(undefined) // null
 * toISOString('invalid') // null
 */
export function toISOString(value: unknown): string | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // Handle Date objects
  if (value instanceof Date) {
    // Check for invalid dates
    if (isNaN(value.getTime())) {
      return null;
    }
    return value.toISOString();
  }

  // Handle string values
  if (typeof value === 'string') {
    // Empty string is treated as null
    if (value.trim() === '') {
      return null;
    }

    // Try parsing the string as a date
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  }

  // Handle numeric timestamps (milliseconds since epoch)
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }

  // All other types return null
  return null;
}

/**
 * Convert a boolean-like value to SQLite integer (0 or 1).
 *
 * SQLite has no boolean type, so we use INTEGER with 0 for false and 1 for true.
 * This function strictly converts to 0 or 1, handling edge cases safely.
 *
 * @param value - Value to convert to SQLite boolean integer
 * @returns 0, 1, or null for null/undefined input
 *
 * @example
 * boolToSQLite(true) // 1
 * boolToSQLite(false) // 0
 * boolToSQLite(1) // 1
 * boolToSQLite(0) // 0
 * boolToSQLite(null) // null
 * boolToSQLite(undefined) // null
 * boolToSQLite('true') // 1
 * boolToSQLite('') // 0
 */
export function boolToSQLite(value: unknown): 0 | 1 | null {
  // Handle null/undefined - these are valid NULL values in SQLite
  if (value === null || value === undefined) {
    return null;
  }

  // Handle actual booleans
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  // Handle numbers (0 is false, any other number is true)
  if (typeof value === 'number') {
    return value === 0 ? 0 : 1;
  }

  // Handle strings
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    // Falsy string values
    if (lower === '' || lower === 'false' || lower === '0' || lower === 'no' || lower === 'null') {
      return 0;
    }
    // Any other non-empty string is truthy
    return 1;
  }

  // For any other type (objects, arrays, etc.), use JavaScript truthiness
  return value ? 1 : 0;
}

/**
 * Convert SQLite integer (0/1) back to JavaScript boolean.
 *
 * This is the inverse of boolToSQLite for reading data back from SQLite.
 *
 * @param value - SQLite integer value (0, 1, or null)
 * @returns true, false, or undefined for null input
 *
 * @example
 * sqliteToBool(1) // true
 * sqliteToBool(0) // false
 * sqliteToBool(null) // undefined
 */
export function sqliteToBool(value: number | null | undefined): boolean | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return value === 1;
}

/**
 * Safely parse a JSON string with a fallback value.
 *
 * SQLite stores complex objects as JSON TEXT. This function safely parses
 * those strings back to objects, returning a fallback if parsing fails.
 *
 * @typeParam T - The expected type of the parsed JSON
 * @param value - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed JSON or fallback value
 *
 * @example
 * safeParseJSON('{"name":"John"}', {}) // { name: 'John' }
 * safeParseJSON('invalid json', {}) // {}
 * safeParseJSON(null, []) // []
 * safeParseJSON('', { default: true }) // { default: true }
 * safeParseJSON('[1,2,3]', []) // [1, 2, 3]
 */
export function safeParseJSON<T>(value: string | null | undefined, fallback: T): T {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return fallback;
  }

  // Handle non-string values (shouldn't happen but be safe)
  if (typeof value !== 'string') {
    return fallback;
  }

  // Handle empty strings
  const trimmed = value.trim();
  if (trimmed === '') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed as T;
  } catch {
    // JSON.parse failed - return fallback
    return fallback;
  }
}

/**
 * Convert a JavaScript object to JSON string for SQLite storage.
 *
 * This is the inverse of safeParseJSON for storing data in SQLite.
 *
 * @param value - Object to stringify
 * @returns JSON string, or null if value is null/undefined
 *
 * @example
 * toJSONString({ name: 'John' }) // '{"name":"John"}'
 * toJSONString([1, 2, 3]) // '[1,2,3]'
 * toJSONString(null) // null
 * toJSONString(undefined) // null
 */
export function toJSONString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    // Circular reference or other stringify error
    return null;
  }
}
