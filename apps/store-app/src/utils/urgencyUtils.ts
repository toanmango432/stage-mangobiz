/**
 * Urgency Utilities for Pending Tickets
 *
 * Provides time-based visual escalation for pending payment tickets.
 * Urgency levels: normal → attention → urgent → critical
 */

export type UrgencyLevel = 'normal' | 'attention' | 'urgent' | 'critical';

// Default thresholds per PRD (can be overridden by settings)
export const DEFAULT_URGENCY_THRESHOLDS = {
  attention: 5,   // 5+ minutes
  urgent: 10,     // 10+ minutes
  critical: 20,   // 20+ minutes
};

// Color classes for each urgency level per PRD (Tailwind)
// normal = white/neutral, attention = yellow, urgent = orange, critical = red
export const URGENCY_COLORS = {
  normal: {
    border: 'border-gray-200',
    bg: 'bg-white',
    dot: 'bg-gray-400',
    text: 'text-gray-700',
    glow: '',
  },
  attention: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    dot: 'bg-yellow-500',
    text: 'text-yellow-800',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
  },
  urgent: {
    border: 'border-orange-400',
    bg: 'bg-orange-100',
    dot: 'bg-orange-600',
    text: 'text-orange-800',
    glow: 'shadow-[0_0_25px_rgba(234,88,12,0.4)]',
  },
  critical: {
    border: 'border-red-400',
    bg: 'bg-red-100',
    dot: 'bg-red-600',
    text: 'text-red-800',
    glow: 'shadow-[0_0_30px_rgba(220,38,38,0.5)]',
  },
};

export interface UrgencyThresholds {
  attention: number;
  urgent: number;
  critical: number;
}

/**
 * Calculate waiting minutes from completedAt timestamp
 */
export function calculateWaitingMinutes(completedAt?: Date | string | null): number {
  if (!completedAt) return 0;

  const completedTime = typeof completedAt === 'string'
    ? new Date(completedAt)
    : completedAt;

  if (isNaN(completedTime.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - completedTime.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Get urgency level based on wait time and thresholds
 */
export function getUrgencyLevel(
  completedAt: Date | string | null | undefined,
  thresholds: UrgencyThresholds = DEFAULT_URGENCY_THRESHOLDS,
  enabled: boolean = true
): UrgencyLevel {
  if (!enabled || !completedAt) return 'normal';

  const waitingMinutes = calculateWaitingMinutes(completedAt);

  if (waitingMinutes >= thresholds.critical) return 'critical';
  if (waitingMinutes >= thresholds.urgent) return 'urgent';
  if (waitingMinutes >= thresholds.attention) return 'attention';
  return 'normal';
}

/**
 * Format waiting time in minutes to a human-readable string.
 *
 * Converts raw minutes into a compact display format suitable for UI.
 * Uses abbreviated time format (m for minutes, h for hours).
 *
 * @param minutes - The number of minutes to format. Can be 0 or negative
 *                  (treated as "Just now") or any positive integer.
 * @returns A formatted string representing the wait time:
 *          - "Just now" for 0 or negative minutes
 *          - "Xm" for 1-59 minutes (e.g., "5m", "45m")
 *          - "Xh Ym" for 60+ minutes (e.g., "1h 5m", "2h 30m")
 *
 * @example
 * // Basic usage
 * formatWaitingTime(0);   // Returns: "Just now"
 * formatWaitingTime(5);   // Returns: "5m"
 * formatWaitingTime(45);  // Returns: "45m"
 * formatWaitingTime(65);  // Returns: "1h 5m"
 * formatWaitingTime(120); // Returns: "2h 0m"
 *
 * @example
 * // Typical usage with calculateWaitingMinutes
 * const minutes = calculateWaitingMinutes(ticket.completedAt);
 * const display = formatWaitingTime(minutes); // "15m"
 */
export function formatWaitingTime(minutes: number): string {
  if (minutes <= 0) return 'Just now';
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/**
 * Get urgency priority for sorting (higher = more urgent)
 */
export function getUrgencyPriority(level: UrgencyLevel): number {
  const priorities: Record<UrgencyLevel, number> = {
    critical: 4,
    urgent: 3,
    attention: 2,
    normal: 1,
  };
  return priorities[level];
}

/**
 * Sort tickets by urgency (most urgent first), then by wait time
 */
export function sortByUrgency<T extends { completedAt?: Date | string | null }>(
  tickets: T[],
  thresholds: UrgencyThresholds = DEFAULT_URGENCY_THRESHOLDS,
  enabled: boolean = true
): T[] {
  if (!enabled) return tickets;

  return [...tickets].sort((a, b) => {
    const urgencyA = getUrgencyLevel(a.completedAt, thresholds, enabled);
    const urgencyB = getUrgencyLevel(b.completedAt, thresholds, enabled);

    const priorityDiff = getUrgencyPriority(urgencyB) - getUrgencyPriority(urgencyA);
    if (priorityDiff !== 0) return priorityDiff;

    // Same urgency level - sort by wait time (longest first)
    const waitA = calculateWaitingMinutes(a.completedAt);
    const waitB = calculateWaitingMinutes(b.completedAt);
    return waitB - waitA;
  });
}

/**
 * Check if any tickets in the list have urgent or critical status
 */
export function hasUrgentTickets<T extends { completedAt?: Date | string | null }>(
  tickets: T[],
  thresholds: UrgencyThresholds = DEFAULT_URGENCY_THRESHOLDS,
  enabled: boolean = true
): boolean {
  if (!enabled) return false;

  return tickets.some(ticket => {
    const level = getUrgencyLevel(ticket.completedAt, thresholds, enabled);
    return level === 'urgent' || level === 'critical';
  });
}

/**
 * Get the highest urgency level from a list of tickets
 */
export function getHighestUrgency<T extends { completedAt?: Date | string | null }>(
  tickets: T[],
  thresholds: UrgencyThresholds = DEFAULT_URGENCY_THRESHOLDS,
  enabled: boolean = true
): UrgencyLevel {
  if (!enabled || tickets.length === 0) return 'normal';

  let highest: UrgencyLevel = 'normal';
  let highestPriority = 1;

  for (const ticket of tickets) {
    const level = getUrgencyLevel(ticket.completedAt, thresholds, enabled);
    const priority = getUrgencyPriority(level);
    if (priority > highestPriority) {
      highest = level;
      highestPriority = priority;
    }
  }

  return highest;
}
