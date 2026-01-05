/**
 * Book Module Design Tokens
 *
 * Module-specific tokens for the appointment calendar/booking system.
 * References the main design system for consistency.
 *
 * Usage:
 *   import { bookTokens } from '@/design-system/modules/book';
 */

import { brand, colors, typography, spacing, shadows, borderRadius } from '../tokens';

// Re-export commonly used tokens from main system
export { brand, colors, typography, spacing, shadows, borderRadius };

/**
 * Book-specific color tokens
 */
export const bookColors = {
  // Primary brand color (Golden Amber)
  primary: brand.primary,

  // Calendar-specific colors
  calendar: {
    gridBg: colors.background.secondary,
    gridLine: 'rgba(0, 0, 0, 0.08)',
    slotHover: brand.primary[50],
    slotSelected: brand.primary[100],
    slotDisabled: '#F3F4F6',
    appointmentBg: colors.background.primary,
    timeLabel: colors.text.secondary,
    currentTime: brand.primary[500],
    currentTimeLine: brand.primary[400],
  },

  // Appointment status colors
  status: {
    scheduled: {
      bg: '#E0F2FE',
      border: '#93C5FD',
      text: '#075985',
      icon: '#3B82F6',
    },
    confirmed: {
      bg: colors.status.success.light,
      border: '#86EFAC',
      text: colors.status.success.dark,
      icon: colors.status.success.main,
    },
    requested: {
      bg: colors.status.warning.light,
      border: '#FCD34D',
      text: colors.status.warning.dark,
      icon: colors.status.warning.main,
    },
    inProgress: {
      bg: '#F3E8FF',
      border: '#D8B4FE',
      text: '#6B21A8',
      icon: '#A855F7',
    },
    checkedIn: {
      bg: '#CFFAFE',
      border: '#67E8F9',
      text: '#155E75',
      icon: '#06B6D4',
    },
    completed: {
      bg: '#F1F5F9',
      border: '#CBD5E1',
      text: '#334155',
      icon: '#64748B',
    },
    cancelled: {
      bg: colors.status.error.light,
      border: '#FCA5A5',
      text: colors.status.error.dark,
      icon: colors.status.error.main,
    },
    noShow: {
      bg: '#FFEDD5',
      border: '#FDBA74',
      text: '#9A3412',
      icon: '#F97316',
    },
  },

  // Staff colors for calendar columns
  staff: [
    brand.primary[500], // Golden Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#14B8A6', // Cyan
  ],
} as const;

/**
 * Book-specific spacing
 */
export const bookSpacing = {
  // Time column
  timeColumnWidth: '60px',

  // Staff column
  staffColumnMinWidth: '200px',
  staffColumnHeaderHeight: '80px',

  // Time slots
  timeSlotHeight: '60px', // 1 hour = 60px
  quarterHourHeight: '15px',

  // Appointment cards
  appointmentPadding: spacing[3],
  appointmentGap: spacing[1],
} as const;

/**
 * Book-specific shadows
 */
export const bookShadows = {
  appointmentCard: shadows.sm,
  appointmentCardHover: shadows.md,
  staffHeader: shadows.xs,
  timeIndicator: '0 0 8px rgba(230, 160, 0, 0.4)', // Golden glow
} as const;

/**
 * Status color type
 */
type StatusColor = {
  readonly bg: string;
  readonly border: string;
  readonly text: string;
  readonly icon: string;
};

/**
 * Helper: Get status color by status key
 */
export function getBookStatusColor(status: string): StatusColor {
  const statusMap: Record<string, StatusColor> = {
    scheduled: bookColors.status.scheduled,
    confirmed: bookColors.status.confirmed,
    requested: bookColors.status.requested,
    'in-progress': bookColors.status.inProgress,
    inProgress: bookColors.status.inProgress,
    'checked-in': bookColors.status.checkedIn,
    checkedIn: bookColors.status.checkedIn,
    completed: bookColors.status.completed,
    cancelled: bookColors.status.cancelled,
    'no-show': bookColors.status.noShow,
    noShow: bookColors.status.noShow,
  };
  return statusMap[status] || bookColors.status.scheduled;
}

/**
 * Helper: Get staff color by index
 */
export function getStaffColor(index: number): string {
  return bookColors.staff[index % bookColors.staff.length];
}

/**
 * Combined export for easy access
 */
export const bookTokens = {
  colors: bookColors,
  spacing: bookSpacing,
  shadows: bookShadows,
  getStatusColor: getBookStatusColor,
  getStaffColor,
} as const;

export default bookTokens;
