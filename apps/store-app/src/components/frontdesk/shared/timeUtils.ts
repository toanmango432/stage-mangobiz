/**
 * Shared Time Utilities for FrontDesk Sections
 *
 * Common time-related helper functions used by WaitListSection, ServiceSection,
 * and other FrontDesk components.
 */

/**
 * Format a date to a time string (e.g., "2:30 PM")
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Calculate wait time in minutes from check-in time to now
 */
export const getWaitTimeMinutes = (createdAt: string | Date): number => {
  const checkInTime = new Date(createdAt);
  return Math.floor((Date.now() - checkInTime.getTime()) / 60000);
};

/**
 * Format wait time to a human-readable string
 */
export const formatWaitTime = (minutes: number): string => {
  if (minutes < 1) return 'Just arrived';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
};

/**
 * Calculate estimated start time based on check-in time and average wait
 */
export const getEstimatedStartTime = (
  createdAt: string | Date,
  avgWaitMinutes: number = 15
): Date => {
  const checkInTime = new Date(createdAt);
  return new Date(checkInTime.getTime() + avgWaitMinutes * 60000);
};

/**
 * Parse a duration string like "45m", "1h", "1h 30m" to minutes
 */
export const parseDuration = (duration: string): number => {
  const hourMatch = duration.match(/(\d+)\s*h/);
  const minMatch = duration.match(/(\d+)\s*m/);
  let minutes = 0;
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);
  return minutes || 60; // default to 60 minutes
};

/**
 * Calculate estimated end time based on start time and duration
 */
export const getEstimatedEndTime = (
  createdAt: string | Date,
  duration: string
): Date => {
  const startTime = new Date(createdAt);
  const durationMinutes = parseDuration(duration);
  return new Date(startTime.getTime() + durationMinutes * 60000);
};

/**
 * Format a duration in minutes to a human-readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Calculate time remaining until estimated end time
 */
export const getTimeRemaining = (estimatedEndTime: Date): number => {
  return Math.max(0, Math.floor((estimatedEndTime.getTime() - Date.now()) / 60000));
};
