/**
 * Design System - Border Radius Tokens
 * Consistent rounding system for corners
 */

export const BOOK_RADIUS = {
  // No rounding
  none: '0',

  // Subtle rounding (1-2px)
  xs: '0.125rem',    // 2px
  sm: '0.25rem',     // 4px - Buttons, badges, small chips

  // Standard rounding (4-8px)
  md: '0.5rem',      // 8px - Inputs, cards, standard components
  lg: '0.75rem',     // 12px - Panels, larger cards

  // Pronounced rounding (12-24px)
  xl: '1rem',        // 16px - Large cards, hero sections
  '2xl': '1.5rem',   // 24px - Modal dialogs, feature cards
  '3xl': '2rem',     // 32px - Very large containers

  // Full rounding (pills, circles)
  full: '9999px',    // Fully rounded (pills, avatars)
} as const;

/**
 * Component-Specific Border Radius
 */
export const COMPONENT_RADIUS = {
  // Buttons
  button: {
    sm: BOOK_RADIUS.sm,      // 4px
    md: BOOK_RADIUS.md,      // 8px
    lg: BOOK_RADIUS.lg,      // 12px
    pill: BOOK_RADIUS.full,  // Full pill
  },

  // Inputs
  input: {
    sm: BOOK_RADIUS.sm,      // 4px
    md: BOOK_RADIUS.md,      // 8px
    lg: BOOK_RADIUS.lg,      // 12px
  },

  // Cards
  card: {
    sm: BOOK_RADIUS.md,      // 8px
    md: BOOK_RADIUS.lg,      // 12px
    lg: BOOK_RADIUS.xl,      // 16px
  },

  // Modals
  modal: {
    sm: BOOK_RADIUS.lg,      // 12px
    md: BOOK_RADIUS.xl,      // 16px
    lg: BOOK_RADIUS['2xl'],  // 24px
  },

  // Badges & Chips
  badge: {
    default: BOOK_RADIUS.sm, // 4px
    pill: BOOK_RADIUS.full,  // Full pill
  },

  // Avatars
  avatar: {
    square: BOOK_RADIUS.md,  // 8px - Rounded square
    circle: BOOK_RADIUS.full, // Full circle
  },

  // Dropdowns & Popovers
  dropdown: BOOK_RADIUS.lg,   // 12px
  popover: BOOK_RADIUS.md,    // 8px
  tooltip: BOOK_RADIUS.sm,    // 4px

  // Calendar Components
  appointmentCard: BOOK_RADIUS.md,    // 8px
  timeSlot: BOOK_RADIUS.sm,           // 4px
  calendarCell: BOOK_RADIUS.md,       // 8px

  // Status Indicators
  statusDot: BOOK_RADIUS.full,        // Full circle
  statusBadge: BOOK_RADIUS.sm,        // 4px

  // Images
  image: {
    sm: BOOK_RADIUS.sm,      // 4px
    md: BOOK_RADIUS.md,      // 8px
    lg: BOOK_RADIUS.lg,      // 12px
    full: BOOK_RADIUS.full,  // Circle
  },
} as const;

/**
 * Helper function to get component radius
 */
export function getComponentRadius(
  component: keyof typeof COMPONENT_RADIUS,
  variant: string = 'md'
): string {
  const radius = COMPONENT_RADIUS[component] as any;

  // If component has variants
  if (typeof radius === 'object' && !Array.isArray(radius)) {
    return radius[variant] || radius.md || BOOK_RADIUS.md;
  }

  // If component has single radius value
  return radius || BOOK_RADIUS.md;
}

// Export types
export type RadiusKey = keyof typeof BOOK_RADIUS;
export type ComponentRadiusKey = keyof typeof COMPONENT_RADIUS;
