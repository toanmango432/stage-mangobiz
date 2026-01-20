/**
 * Offline Grace Indicator
 *
 * Displays the remaining offline access period for users when:
 * - They are offline (shows connection warning)
 * - Their grace period is approaching expiry (<= 5 days)
 * - Critical warning when <= 2 days remaining
 *
 * When online with > 5 days remaining, nothing is displayed.
 *
 * @see docs/AUTH_MIGRATION_PLAN.md - Offline Grace Period section
 */

import { WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for OfflineGraceIndicator component
 */
interface OfflineGraceIndicatorProps {
  /** Number of days remaining in the offline grace period */
  daysRemaining: number;
  /** Whether the device is currently offline */
  isOffline: boolean;
  /** Optional className for custom positioning */
  className?: string;
}

/**
 * Severity level based on days remaining and online status
 */
type Severity = 'none' | 'warning' | 'critical';

/**
 * Determines the severity level for display
 */
function getSeverity(daysRemaining: number, isOffline: boolean): Severity {
  // Critical: <= 2 days remaining (regardless of online status)
  if (daysRemaining <= 2) {
    return 'critical';
  }

  // Warning: offline OR <= 5 days remaining
  if (isOffline || daysRemaining <= 5) {
    return 'warning';
  }

  // No indicator needed
  return 'none';
}

/**
 * Format days remaining for display
 */
function formatDaysRemaining(days: number): string {
  if (days <= 0) {
    return 'Offline access expired';
  }
  if (days === 1) {
    return '1 day offline access remaining';
  }
  return `${days} days offline access remaining`;
}

/**
 * Offline Grace Indicator Component
 *
 * Displays a small banner or badge showing the remaining offline access period.
 * Uses yellow for warning (offline or <= 5 days) and red for critical (<= 2 days).
 * Shows nothing when online with > 5 days remaining.
 *
 * @example
 * // In a header or status bar
 * <OfflineGraceIndicator
 *   daysRemaining={3}
 *   isOffline={false}
 *   className="fixed bottom-4 right-4"
 * />
 */
export function OfflineGraceIndicator({
  daysRemaining,
  isOffline,
  className,
}: OfflineGraceIndicatorProps) {
  const severity = getSeverity(daysRemaining, isOffline);

  // Don't render anything if no warning needed
  if (severity === 'none') {
    return null;
  }

  // Determine styling based on severity
  const isWarning = severity === 'warning';
  const isCritical = severity === 'critical';

  // Background and border colors
  const containerStyles = cn(
    // Base styles
    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
    'border transition-colors duration-200',
    // Warning styles (yellow/amber)
    isWarning && [
      'bg-amber-50 border-amber-200 text-amber-800',
      'dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
    ],
    // Critical styles (red)
    isCritical && [
      'bg-red-50 border-red-200 text-red-800',
      'dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    ],
    className
  );

  // Icon styles
  const iconStyles = cn(
    'w-4 h-4 flex-shrink-0',
    isWarning && 'text-amber-600 dark:text-amber-400',
    isCritical && 'text-red-600 dark:text-red-400'
  );

  // Select appropriate icon
  const Icon = isOffline ? WifiOff : isCritical ? AlertTriangle : Clock;

  // Build message
  const message = isOffline
    ? 'Offline - connect to extend access'
    : formatDaysRemaining(daysRemaining);

  return (
    <div
      className={containerStyles}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon className={iconStyles} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default OfflineGraceIndicator;
