/**
 * Design System Module Adapters
 *
 * Module-specific design tokens that extend the main design system.
 * Each module provides specialized tokens for its feature area.
 */

// Book module (calendar/appointments)
export { bookTokens, bookColors, bookSpacing, bookShadows, getBookStatusColor, getStaffColor } from './book';
export type { } from './book';

// Front Desk module (ticket management)
export { frontDeskTokens, paperColors, statusColors, badgeColors, ticketShadows, motion, ticketDimensions, getStatusColors, getBadgeColors, getCombinedShadow } from './frontdesk';
export type { } from './frontdesk';

// Ticket Panel module (checkout)
export { ticketPanelTokens, ClientSectionStyles, StaffGroupStyles, ServiceRowStyles, TotalsStyles, EmptyStateStyles } from './ticketPanel';
export type { } from './ticketPanel';

// Re-export main tokens for convenience
export { brand, colors, typography, spacing, shadows, borderRadius, transitions, zIndex } from '../tokens';
