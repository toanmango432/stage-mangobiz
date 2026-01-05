/**
 * StaffCard Module Exports
 * Centralized exports for all staff card components and utilities
 */

// Main Components
export { StaffCardVertical } from './StaffCardVertical';
export type { StaffCardVerticalProps, StaffMember, ViewMode, StaffStatus, Specialty } from './StaffCardVertical';

// Sub-components (exported for advanced usage)
export { StaffCardNotch } from './components/StaffCardNotch';
export { StaffCardAvatar } from './components/StaffCardAvatar';
export { StaffCardTicket } from './components/StaffCardTicket';
export { StaffCardTimeline } from './components/StaffCardTimeline';
export { StaffCardMetrics } from './components/StaffCardMetrics';
export { StaffCardSkeleton, StaffCardSkeletonGrid } from './components/StaffCardSkeleton';

// Hooks
export { useStaffCardLayout } from './hooks/useStaffCardLayout';
export { useStaffCardDisplay } from './hooks/useStaffCardDisplay';
export type { DisplayConfig } from './hooks/useStaffCardDisplay';

// Constants & Tokens
export {
  SPECIALTY_COLORS,
  STATUS_COLORS,
  CARD_DIMENSIONS,
  getResponsiveSizes,
  CARD_SHADOWS,
  BUSY_OVERLAY,
  getProgressColor,
  getProgressGradient,
  ANIMATIONS,
  LAYOUT,
  TICKET_STYLES,
  A11Y,
  CONTAINER_BREAKPOINTS,
} from './constants/staffCardTokens';

// Utilities
export {
  formatStaffName,
  formatClockedInTime,
  formatTime,
  formatDuration,
  formatCurrency,
  formatClientName,
  truncateText,
  formatProgress,
} from './utils/formatters';

// Touch Target Utilities
export {
  MIN_TOUCH_TARGET_SIZE,
  isTouchTargetValid,
  getTouchTargetPadding,
  touchTargetStyle,
  TOUCH_TARGET_CLASSES,
  getResponsiveTouchTarget,
  useTouchDevice,
} from './utils/touchTargets';
