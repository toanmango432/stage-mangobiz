/**
 * Formatting utilities for staff cards
 * Memoized functions for time, names, and other data formatting
 */

/**
 * Format staff name (first name only)
 * @param fullName - Full name of staff member
 * @returns First name only
 */
export const formatStaffName = (fullName: string): string => {
  const nameParts = fullName.trim().split(' ');
  return nameParts[0];
};

/**
 * Format time with seconds and a/p notation
 * Used for clocked-in time display
 * @param _timeString - Time string (currently unused, uses current time)
 * @returns Formatted time string (e.g., "2:45:30p")
 */
export const formatClockedInTime = (_timeString: string): string => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const period = hours >= 12 ? 'p' : 'a';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}${period}`;
};

/**
 * Format time without seconds for last/next appointments
 * @param timeString - Time string (e.g., "2:30 PM", "14:30", "2:30p")
 * @returns Formatted time string (e.g., "2:30p")
 */
export const formatTime = (timeString?: string): string => {
  if (!timeString) return '-';

  // If already in short format like "2:30p", return as-is
  if (/^\d{1,2}:\d{2}[ap]$/i.test(timeString)) {
    return timeString.toLowerCase();
  }

  // Try to parse various time formats
  const trimmed = timeString.trim();

  // Match "2:30 PM" or "2:30PM" or "14:30"
  const match12h = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|a|p)?$/i);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = match12h[2];
    const periodInput = match12h[3]?.toLowerCase() || '';

    // Determine period
    let period: string;
    if (periodInput === 'pm' || periodInput === 'p') {
      period = 'p';
      if (hours < 12) hours = hours; // Keep as-is for PM display
    } else if (periodInput === 'am' || periodInput === 'a') {
      period = 'a';
    } else {
      // No period provided, assume 24h format
      period = hours >= 12 ? 'p' : 'a';
      if (hours > 12) hours = hours - 12;
      if (hours === 0) hours = 12;
    }

    // For 12-hour with PM indicator, convert display
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);

    return `${displayHours}:${minutes}${period}`;
  }

  // Return original if can't parse
  return timeString;
};

/**
 * Format duration in minutes
 * @param minutes - Duration in minutes
 * @returns Formatted duration (e.g., "45m", "1h 30m")
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format currency amount
 * @param amount - Amount in dollars
 * @returns Formatted currency (e.g., "$45.00")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format client name (first name only)
 * @param fullName - Full client name
 * @returns First name only
 */
export const formatClientName = (fullName: string): string => {
  return fullName.split(' ')[0];
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format progress percentage
 * @param progress - Progress value (0-1)
 * @returns Percentage string (e.g., "67%")
 */
export const formatProgress = (progress: number): string => {
  return `${Math.round(progress * 100)}%`;
};

/**
 * Format minutes for time display
 * @param minutes - Duration in minutes
 * @returns Formatted minutes string (e.g., "15m", "0m")
 */
export const formatMinutes = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0m';
  return `${Math.round(minutes)}m`;
};
