/**
 * Date Utilities with Timezone Support
 *
 * CRITICAL: This is a calendar-based app. All dates must be handled with timezone awareness.
 *
 * Principles:
 * 1. STORAGE: Always store dates as ISO 8601 strings in UTC (what Supabase returns)
 * 2. DISPLAY: Always convert to store's timezone for display
 * 3. INPUT: When user picks a date/time, convert from store timezone to UTC for storage
 *
 * Example:
 * - Store timezone: "America/Los_Angeles" (PST/PDT)
 * - User books appointment at 2:00 PM local time
 * - Stored as: "2024-01-15T22:00:00.000Z" (UTC)
 * - Displayed as: "2:00 PM" (in store's timezone)
 */

// ==================== TYPES ====================

export type DateInput = Date | string | number;

export interface DateFormatOptions {
  timezone?: string;
  includeTime?: boolean;
  includeSeconds?: boolean;
  use24Hour?: boolean;
}

export interface TimeFormatOptions {
  timezone?: string;
  use24Hour?: boolean;
  includeSeconds?: boolean;
}

// ==================== CONSTANTS ====================

const DEFAULT_TIMEZONE = 'America/Los_Angeles';

// Store timezone - will be set from store config on login
let _storeTimezone: string = DEFAULT_TIMEZONE;

// ==================== TIMEZONE CONFIGURATION ====================

/**
 * Set the store's timezone (call this after login)
 * @param timezone IANA timezone string (e.g., "America/Los_Angeles")
 */
export function setStoreTimezone(timezone: string): void {
  if (isValidTimezone(timezone)) {
    _storeTimezone = timezone;
    console.log('[DateUtils] Store timezone set to:', timezone);
  } else {
    console.warn('[DateUtils] Invalid timezone:', timezone, '- using default:', DEFAULT_TIMEZONE);
    _storeTimezone = DEFAULT_TIMEZONE;
  }
}

/**
 * Get the current store timezone
 */
export function getStoreTimezone(): string {
  return _storeTimezone;
}

/**
 * Check if a timezone string is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the browser's local timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// ==================== PARSING ====================

/**
 * Parse any date input to a Date object
 * Accepts: Date, ISO string, timestamp
 */
export function parseDate(input: DateInput): Date {
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === 'number') {
    return new Date(input);
  }
  // String - parse as ISO
  return new Date(input);
}

/**
 * Parse a date input to ISO string (UTC)
 * This is the format we store in the database
 */
export function toISOString(input: DateInput): string {
  return parseDate(input).toISOString();
}

/**
 * Check if a date string/object is valid
 */
export function isValidDate(input: DateInput): boolean {
  const date = parseDate(input);
  return !isNaN(date.getTime());
}

// ==================== FORMATTING (DISPLAY) ====================

/**
 * Format a date for display in the store's timezone
 * @param input Date, ISO string, or timestamp
 * @param options Formatting options
 */
export function formatDate(input: DateInput, options: DateFormatOptions = {}): string {
  const {
    timezone = _storeTimezone,
    includeTime = false,
    includeSeconds = false,
    use24Hour = false,
  } = options;

  const date = parseDate(input);
  if (!isValidDate(date)) return 'Invalid Date';

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = 'numeric';
    dateOptions.minute = '2-digit';
    dateOptions.hour12 = !use24Hour;
    if (includeSeconds) {
      dateOptions.second = '2-digit';
    }
  }

  return date.toLocaleString('en-US', dateOptions);
}

/**
 * Format a date as a short date (e.g., "Jan 15, 2024")
 */
export function formatShortDate(input: DateInput, timezone?: string): string {
  const date = parseDate(input);
  if (!isValidDate(date)) return 'Invalid Date';

  return date.toLocaleDateString('en-US', {
    timeZone: timezone || _storeTimezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as a long date (e.g., "Monday, January 15, 2024")
 */
export function formatLongDate(input: DateInput, timezone?: string): string {
  const date = parseDate(input);
  if (!isValidDate(date)) return 'Invalid Date';

  return date.toLocaleDateString('en-US', {
    timeZone: timezone || _storeTimezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time only (e.g., "2:30 PM" or "14:30")
 */
export function formatTime(input: DateInput, options: TimeFormatOptions = {}): string {
  const {
    timezone = _storeTimezone,
    use24Hour = false,
    includeSeconds = false,
  } = options;

  const date = parseDate(input);
  if (!isValidDate(date)) return 'Invalid Time';

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  };

  if (includeSeconds) {
    timeOptions.second = '2-digit';
  }

  return date.toLocaleTimeString('en-US', timeOptions);
}

/**
 * Format date and time together (e.g., "Jan 15, 2024 at 2:30 PM")
 */
export function formatDateTime(input: DateInput, timezone?: string): string {
  const date = parseDate(input);
  if (!isValidDate(date)) return 'Invalid Date';

  const tz = timezone || _storeTimezone;

  const datePart = date.toLocaleDateString('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timePart = date.toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} at ${timePart}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelative(input: DateInput): string {
  const date = parseDate(input);
  if (!isValidDate(date)) return 'Invalid Date';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, 'second');
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  } else if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, 'day');
  } else {
    return formatShortDate(date);
  }
}

// ==================== DATE MATH ====================

/**
 * Get start of day in store timezone (returns Date representing midnight in that timezone)
 *
 * Example: If store is in LA (UTC-8) and input is any time on Jan 15:
 * - Returns Date representing 2025-01-15T08:00:00.000Z (midnight LA = 8AM UTC)
 */
export function startOfDay(input: DateInput, timezone?: string): Date {
  const tz = timezone || _storeTimezone;
  const date = parseDate(input);

  // Get date parts in target timezone (YYYY-MM-DD format)
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // Create midnight in target timezone and convert to UTC
  return createDateInTimezone(dateParts, '00:00', tz);
}

/**
 * Get end of day in store timezone (23:59:59.999)
 */
export function endOfDay(input: DateInput, timezone?: string): Date {
  const tz = timezone || _storeTimezone;
  const date = parseDate(input);

  // Get date parts in target timezone
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // Create 23:59:59.999 in target timezone
  const endDate = createDateInTimezone(dateParts, '23:59', tz);
  endDate.setSeconds(59, 999);
  return endDate;
}

/**
 * Helper: Create a Date object from a date string and time string in a specific timezone
 * Returns a Date object with the correct UTC time
 */
function createDateInTimezone(dateStr: string, timeStr: string, timezone: string): Date {
  // dateStr format: YYYY-MM-DD, timeStr format: HH:mm
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Create a date string and get what time it would be in UTC
  // Using a reference point approach to calculate timezone offset
  const isoString = `${dateStr}T${timeStr.padStart(5, '0')}:00.000`;

  // Parse as if it's in the local browser timezone first
  const localParsed = new Date(isoString);

  // Get the formatted time in both UTC and target timezone
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });

  // Calculate offset by comparing how the same instant appears in UTC vs target TZ
  const utcParts = utcFormatter.formatToParts(localParsed);
  const tzParts = tzFormatter.formatToParts(localParsed);

  const getPartValue = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parseInt(parts.find(p => p.type === type)?.value || '0', 10);

  // Build dates from parts
  const utcTime = Date.UTC(
    getPartValue(utcParts, 'year'),
    getPartValue(utcParts, 'month') - 1,
    getPartValue(utcParts, 'day'),
    getPartValue(utcParts, 'hour'),
    getPartValue(utcParts, 'minute'),
    getPartValue(utcParts, 'second')
  );

  const tzTime = Date.UTC(
    getPartValue(tzParts, 'year'),
    getPartValue(tzParts, 'month') - 1,
    getPartValue(tzParts, 'day'),
    getPartValue(tzParts, 'hour'),
    getPartValue(tzParts, 'minute'),
    getPartValue(tzParts, 'second')
  );

  // Offset = how much to add to target TZ time to get UTC
  const offsetMs = utcTime - tzTime;

  // Create the final date: target time + offset = UTC
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetTimeMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);

  return new Date(targetTimeMs + offsetMs);
}

/**
 * Add days to a date
 */
export function addDays(input: DateInput, days: number): Date {
  const date = parseDate(input);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Add hours to a date
 */
export function addHours(input: DateInput, hours: number): Date {
  const date = parseDate(input);
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return date;
}

/**
 * Add minutes to a date
 */
export function addMinutes(input: DateInput, minutes: number): Date {
  const date = parseDate(input);
  date.setTime(date.getTime() + minutes * 60 * 1000);
  return date;
}

/**
 * Check if two dates are the same day (in store timezone)
 */
export function isSameDay(date1: DateInput, date2: DateInput, timezone?: string): boolean {
  const tz = timezone || _storeTimezone;

  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  const format = (d: Date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

  return format(d1) === format(d2);
}

/**
 * Check if a date is today (in store timezone)
 */
export function isToday(input: DateInput, timezone?: string): boolean {
  return isSameDay(input, new Date(), timezone);
}

/**
 * Check if a date is in the past
 */
export function isPast(input: DateInput): boolean {
  return parseDate(input).getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isFuture(input: DateInput): boolean {
  return parseDate(input).getTime() > Date.now();
}

// ==================== CONVERSION FOR STORAGE ====================

/**
 * Convert a local time string (HH:mm) on a specific date to UTC ISO string
 * Use this when user picks a time in the booking UI
 *
 * Example: User in LA store picks 2:00 PM on Jan 15
 * - Input: date = Jan 15, timeString = "14:00", timezone = "America/Los_Angeles"
 * - Output: "2025-01-15T22:00:00.000Z" (2PM LA = 10PM UTC)
 *
 * @param dateInput The date (will extract YYYY-MM-DD in store timezone)
 * @param timeString Time string in "HH:mm" format (e.g., "14:30")
 * @param timezone Store timezone (defaults to current store timezone)
 */
export function localTimeToUTC(
  dateInput: DateInput,
  timeString: string,
  timezone?: string
): string {
  const tz = timezone || _storeTimezone;
  const date = parseDate(dateInput);

  // Get date parts in target timezone (YYYY-MM-DD format)
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // Use the helper function to create proper UTC Date
  const utcDate = createDateInTimezone(dateParts, timeString, tz);

  return utcDate.toISOString();
}

/**
 * Get the current time in ISO format (UTC)
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get today's date at midnight in store timezone, as ISO string
 */
export function todayISO(timezone?: string): string {
  return startOfDay(new Date(), timezone).toISOString();
}

// ==================== CALENDAR HELPERS ====================

/**
 * Get the day of week (0 = Sunday, 6 = Saturday) in store timezone
 */
export function getDayOfWeek(input: DateInput, timezone?: string): number {
  const tz = timezone || _storeTimezone;
  const date = parseDate(input);

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).format(date);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.indexOf(weekday);
}

/**
 * Get formatted weekday name
 */
export function getWeekdayName(input: DateInput, format: 'short' | 'long' = 'short', timezone?: string): string {
  const date = parseDate(input);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || _storeTimezone,
    weekday: format,
  }).format(date);
}

/**
 * Get array of dates for a week starting from a given date
 */
export function getWeekDates(startDate: DateInput, timezone?: string): Date[] {
  const dates: Date[] = [];
  const start = startOfDay(startDate, timezone);

  for (let i = 0; i < 7; i++) {
    dates.push(addDays(start, i));
  }

  return dates;
}

// ==================== DURATION FORMATTING ====================

/**
 * Format duration in minutes to human-readable string
 * @param minutes Duration in minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

/**
 * Format duration between two dates
 */
export function formatDurationBetween(start: DateInput, end: DateInput): string {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  return formatDuration(minutes);
}
