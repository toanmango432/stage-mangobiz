/**
 * Shared Time Formatting Utilities
 * Centralized time formatting to reduce code duplication across Book module
 */

/**
 * Format time for display (12-hour format with AM/PM)
 * @param date Date object or ISO string
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format time for display (24-hour format)
 * @param date Date object or ISO string
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTime24(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format date for display
 * @param date Date object or ISO string
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: {
    includeYear?: boolean;
    style?: 'short' | 'long' | 'full';
  } = {}
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { includeYear = true, style = 'long' } = options;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check for today/tomorrow
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (d.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  // Format based on style
  switch (style) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: includeYear ? 'numeric' : undefined,
      });
    case 'full':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: includeYear ? 'numeric' : undefined,
      });
    case 'long':
    default:
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: includeYear && d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
  }
}

/**
 * Format hour for display (12-hour format)
 * @param hour Hour (0-23)
 * @returns Formatted hour string (e.g., "2 PM", "12 AM")
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/**
 * Format duration in minutes to human-readable string
 * @param minutes Duration in minutes
 * @returns Formatted duration (e.g., "1h 30m", "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format time range for display
 * @param start Start time
 * @param end End time
 * @returns Formatted time range (e.g., "2:30 PM - 3:30 PM")
 */
export function formatTimeRange(start: Date | string, end: Date | string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Check if a date is today
 * @param date Date to check
 * @returns true if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns true if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Get relative time description
 * @param date Date to describe
 * @returns Relative time string (e.g., "in 2 hours", "5 minutes ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins === 0) return 'now';
  if (diffMins > 0) {
    // Future
    if (diffMins < 60) return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    const diffDays = Math.round(diffHours / 24);
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    // Past
    const absMins = Math.abs(diffMins);
    if (absMins < 60) return `${absMins} minute${absMins !== 1 ? 's' : ''} ago`;
    const absHours = Math.round(absMins / 60);
    if (absHours < 24) return `${absHours} hour${absHours !== 1 ? 's' : ''} ago`;
    const absDays = Math.round(absHours / 24);
    return `${absDays} day${absDays !== 1 ? 's' : ''} ago`;
  }
}
