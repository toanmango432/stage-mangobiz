/**
 * Front Desk Module Design Tokens
 *
 * Module-specific tokens for the front desk ticket management system.
 * Maintains the paper-ticket charm while using the main design system.
 *
 * Usage:
 *   import { frontDeskTokens } from '@/design-system/modules/frontdesk';
 */

import { brand, colors, typography, spacing, shadows } from '../tokens';

// Re-export commonly used tokens from main system
export { brand, colors, typography, spacing, shadows };

/**
 * Paper ticket styling (unique to Front Desk)
 */
export const paperColors = {
  base: '#FFF9F4',           // Soft ivory base for all tickets
  hover: '#FFFCF9',          // 2% lighter on hover
  selected: '#FFF6EF',       // Slightly warmer when selected
  texture: 'rgba(0,0,0,0.04)', // Subtle texture overlay
} as const;

/**
 * Front Desk status colors
 * Maps to the main colors.frontDesk from tokens.ts
 */
export const statusColors = {
  waiting: {
    bg: colors.frontDesk.waiting.bg,
    border: colors.frontDesk.waiting.border,
    text: colors.frontDesk.waiting.text,
    icon: colors.frontDesk.waiting.icon,
    primary: '#FFE7B3',      // Light amber
    hover: '#FFD280',        // Darker amber on hover
  },
  inService: {
    bg: colors.frontDesk.inService.bg,
    border: colors.frontDesk.inService.border,
    text: colors.frontDesk.inService.text,
    icon: colors.frontDesk.inService.icon,
    primary: '#C9F3D1',      // Soft mint green
    hover: '#A5E8B0',        // Darker mint on hover
  },
  coming: {
    bg: colors.frontDesk.coming.bg,
    border: colors.frontDesk.coming.border,
    text: colors.frontDesk.coming.text,
    icon: colors.frontDesk.coming.icon,
    primary: '#BAE6FD',      // Light sky blue
    hover: '#7DD3FC',        // Darker blue on hover
  },
  pending: {
    bg: colors.frontDesk.pending.bg,
    border: colors.frontDesk.pending.border,
    text: colors.frontDesk.pending.text,
    icon: colors.frontDesk.pending.icon,
    primary: '#ECECEC',      // Light gray
    hover: '#D4D4D4',        // Darker gray on hover
  },
  completed: {
    bg: colors.frontDesk.completed.bg,
    border: colors.frontDesk.completed.border,
    text: colors.frontDesk.completed.text,
    icon: colors.frontDesk.completed.icon,
    primary: '#D1F4E0',      // Light green
    hover: '#B7F0D0',        // Darker green on hover
  },
} as const;

/**
 * Client type badge colors
 */
export const badgeColors = {
  vip: {
    bg: '#FFF9E6',
    text: '#8B6914',
    border: '#E5D4A0',
    icon: brand.primary[500], // Golden Amber
    accent: '#F59E0B',
  },
  priority: {
    bg: '#FFF1F0',
    text: '#B91C1C',
    border: '#FCA5A5',
    icon: colors.status.error.main,
    accent: '#EF4444',
  },
  new: {
    bg: '#EEF2FF',
    text: '#4338CA',
    border: '#C7D2FE',
    icon: '#6366F1',
    accent: '#6366F1',
  },
  regular: {
    bg: '#F9FAFB',
    text: '#4B5563',
    border: '#E5E7EB',
    icon: '#6B7280',
    accent: '#6B7280',
  },
} as const;

/**
 * Ticket card shadows
 */
export const ticketShadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
  md: '0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.08)',
  xl: '0 8px 16px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.1)',
  // Paper sheen effect (inset highlights)
  insetSubtle: 'inset 0 0 0 1px rgba(255, 255, 255, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
  insetStrong: 'inset 0 0 0 1px rgba(255, 255, 255, 0.9), inset 0 1px 1px rgba(255, 255, 255, 1)',
} as const;

/**
 * Animation/motion tokens
 */
export const motion = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  elevation: {
    lift: 'translateY(-2px)',
    press: 'translateY(0px) scale(0.99)',
  },
} as const;

/**
 * Ticket card dimensions
 */
export const ticketDimensions = {
  minHeight: {
    compact: '32px',
    normal: '60px',
    gridNormal: '200px',
    gridCompact: '120px',
  },
  padding: {
    compact: '4px 8px',
    normal: '8px 12px',
    gridNormal: '16px',
    gridCompact: '12px',
  },
  gap: {
    tight: '4px',
    normal: '8px',
    relaxed: '12px',
    loose: '16px',
  },
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '10px',
  },
  statusStrip: {
    width: '5px',
    borderRadius: '0',
  },
} as const;

/**
 * Helper: Get status colors by status key
 */
export function getStatusColors(status: 'waiting' | 'inService' | 'coming' | 'pending' | 'completed' | string) {
  const normalizedStatus = status === 'in-service' ? 'inService' : status;
  return statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.pending;
}

/**
 * Helper: Get badge colors by client type
 */
export function getBadgeColors(clientType: 'vip' | 'priority' | 'new' | 'regular' | string) {
  const normalizedType = clientType.toLowerCase() as keyof typeof badgeColors;
  return badgeColors[normalizedType] || badgeColors.regular;
}

/**
 * Helper: Get combined shadow with inset highlights
 */
export function getCombinedShadow(elevation: 'sm' | 'md' | 'lg' | 'xl', withInset: boolean = true) {
  const shadow = ticketShadows[elevation];
  if (withInset) {
    return `${shadow}, ${ticketShadows.insetSubtle}`;
  }
  return shadow;
}

/**
 * Combined export for easy access
 */
export const frontDeskTokens = {
  paper: paperColors,
  status: statusColors,
  badges: badgeColors,
  shadows: ticketShadows,
  motion,
  dimensions: ticketDimensions,
  getStatusColors,
  getBadgeColors,
  getCombinedShadow,
} as const;

export default frontDeskTokens;
