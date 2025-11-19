/**
 * Design System - Shadow & Elevation Tokens
 * Consistent depth and elevation system
 */

export const BOOK_SHADOWS = {
  // Subtle elevation (minimal depth)
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

  // Small elevation (buttons, chips)
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',

  // Medium elevation (cards, dropdowns)
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

  // Large elevation (floating elements, popovers)
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

  // Extra large elevation (modals, dialogs)
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // 2XL elevation (active dragging, emphasized modals)
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Inner shadows (for inputs, pressed states)
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // No shadow
  none: 'none',
} as const;

/**
 * Colored Shadows
 * Shadows with brand color tints for special emphasis
 */
export const COLORED_SHADOWS = {
  // Primary (Teal)
  primary: {
    sm: '0 1px 3px 0 rgba(20, 184, 166, 0.2), 0 1px 2px 0 rgba(20, 184, 166, 0.1)',
    md: '0 4px 6px -1px rgba(20, 184, 166, 0.2), 0 2px 4px -1px rgba(20, 184, 166, 0.1)',
    lg: '0 10px 15px -3px rgba(20, 184, 166, 0.2), 0 4px 6px -2px rgba(20, 184, 166, 0.1)',
  },

  // Secondary (Purple)
  secondary: {
    sm: '0 1px 3px 0 rgba(147, 51, 234, 0.2), 0 1px 2px 0 rgba(147, 51, 234, 0.1)',
    md: '0 4px 6px -1px rgba(147, 51, 234, 0.2), 0 2px 4px -1px rgba(147, 51, 234, 0.1)',
    lg: '0 10px 15px -3px rgba(147, 51, 234, 0.2), 0 4px 6px -2px rgba(147, 51, 234, 0.1)',
  },

  // Success (Green)
  success: {
    sm: '0 1px 3px 0 rgba(16, 185, 129, 0.2), 0 1px 2px 0 rgba(16, 185, 129, 0.1)',
    md: '0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1)',
  },

  // Error (Red)
  error: {
    sm: '0 1px 3px 0 rgba(239, 68, 68, 0.2), 0 1px 2px 0 rgba(239, 68, 68, 0.1)',
    md: '0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1)',
  },
} as const;

/**
 * Focus Rings
 * Accessibility-focused outline shadows
 */
export const FOCUS_RINGS = {
  // Default focus ring (primary color)
  default: '0 0 0 3px rgba(20, 184, 166, 0.2)',

  // Secondary focus ring
  secondary: '0 0 0 3px rgba(147, 51, 234, 0.2)',

  // Error focus ring
  error: '0 0 0 3px rgba(239, 68, 68, 0.2)',

  // Offset focus ring (for buttons with background)
  offset: '0 0 0 2px #ffffff, 0 0 0 4px rgba(20, 184, 166, 0.4)',
} as const;

/**
 * Elevation Levels
 * Semantic elevation for different component types
 */
export const ELEVATION = {
  // Level 0: Flat on surface (no shadow)
  flat: BOOK_SHADOWS.none,

  // Level 1: Slightly raised (cards at rest)
  raised: BOOK_SHADOWS.sm,

  // Level 2: Floating (dropdowns, popovers)
  floating: BOOK_SHADOWS.md,

  // Level 3: Overlay (modals, dialogs)
  overlay: BOOK_SHADOWS.lg,

  // Level 4: Emphasized (active drag, important modals)
  emphasized: BOOK_SHADOWS.xl,

  // Level 5: Maximum (very rare, hero sections)
  maximum: BOOK_SHADOWS['2xl'],
} as const;

/**
 * Component-Specific Shadows
 * Pre-defined shadows for common components
 */
export const COMPONENT_SHADOWS = {
  // Cards
  card: {
    rest: BOOK_SHADOWS.sm,
    hover: BOOK_SHADOWS.md,
    active: BOOK_SHADOWS.xs,
  },

  // Buttons
  button: {
    rest: BOOK_SHADOWS.xs,
    hover: BOOK_SHADOWS.sm,
    active: BOOK_SHADOWS.inner,
  },

  // Modals
  modal: {
    backdrop: 'none',
    content: BOOK_SHADOWS.xl,
  },

  // Dropdowns
  dropdown: {
    rest: BOOK_SHADOWS.lg,
  },

  // Tooltips
  tooltip: {
    rest: BOOK_SHADOWS.md,
  },

  // Floating Action Button
  fab: {
    rest: BOOK_SHADOWS.lg,
    hover: BOOK_SHADOWS.xl,
    active: BOOK_SHADOWS.md,
  },

  // Appointment Card (Calendar)
  appointmentCard: {
    rest: BOOK_SHADOWS.xs,
    hover: BOOK_SHADOWS.md,
    dragging: BOOK_SHADOWS['2xl'],
  },
} as const;

/**
 * Helper function to get component shadow
 */
export function getComponentShadow(
  component: keyof typeof COMPONENT_SHADOWS,
  state: string = 'rest'
): string {
  const shadows = COMPONENT_SHADOWS[component] as any;
  return shadows[state] || BOOK_SHADOWS.none;
}

// Export types
export type ShadowKey = keyof typeof BOOK_SHADOWS;
export type ElevationKey = keyof typeof ELEVATION;
export type ComponentShadowKey = keyof typeof COMPONENT_SHADOWS;
