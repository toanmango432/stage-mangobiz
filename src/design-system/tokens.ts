/**
 * Mango Design System - Single Source of Truth
 *
 * This file defines ALL design tokens for the Mango POS application.
 * All other style files (CSS, Tailwind, components) should reference these values.
 *
 * Brand Color: Golden Amber - Premium, timeless, represents ripe mango
 *
 * @version 2.0
 * @updated 2024-12
 */

// =============================================================================
// BRAND COLORS - Golden Amber Theme
// =============================================================================

export const brand = {
  // Primary - Golden Amber (main brand color)
  primary: {
    50: '#FFFBF0',
    100: '#FEF3D8',
    200: '#FDE7B1',
    300: '#FBD88A',
    400: '#F9C663',
    500: '#E6A000',  // Main brand color
    600: '#CC8E00',
    700: '#A67300',
    800: '#805900',
    900: '#5C4000',
  },

  // HSL values for CSS variables
  hsl: {
    primary: '40 100% 45%',
    primaryForeground: '0 0% 100%',
    primaryLight: '40 100% 97%',
    primaryDark: '40 100% 35%',
  },
} as const;

// =============================================================================
// SEMANTIC COLORS
// =============================================================================

export const colors = {
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAF9',
    tertiary: '#F5F5F4',
    muted: '#F5F5F4',
  },

  // Text colors
  text: {
    primary: '#1C1917',
    secondary: '#57534E',
    muted: '#A8A29E',
    inverse: '#FFFFFF',
  },

  // Border colors
  border: {
    light: '#E7E5E4',
    medium: '#D6D3D1',
    dark: '#A8A29E',
  },

  // Status colors
  status: {
    success: {
      light: '#DCFCE7',
      main: '#22C55E',
      dark: '#16A34A',
    },
    warning: {
      light: '#FEF3C7',
      main: '#F59E0B',
      dark: '#D97706',
    },
    error: {
      light: '#FEE2E2',
      main: '#EF4444',
      dark: '#DC2626',
    },
    info: {
      light: '#DBEAFE',
      main: '#3B82F6',
      dark: '#2563EB',
    },
  },

  // Front Desk module colors
  frontDesk: {
    waiting: {
      bg: '#FAF5FF',
      border: '#E9D5FF',
      text: '#7C3AED',
      icon: '#A855F7',
    },
    inService: {
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#16A34A',
      icon: '#22C55E',
    },
    coming: {
      bg: '#F0F9FF',
      border: '#BAE6FD',
      text: '#0369A1',
      icon: '#0EA5E9',
    },
    pending: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#B45309',
      icon: '#F59E0B',
    },
    completed: {
      bg: '#F8FAFC',
      border: '#E2E8F0',
      text: '#475569',
      icon: '#64748B',
    },
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
  },

  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  base: '0.375rem', // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '400ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const components = {
  button: {
    primary: {
      bg: brand.primary[500],
      bgHover: brand.primary[600],
      text: '#FFFFFF',
    },
    secondary: {
      bg: brand.primary[50],
      bgHover: brand.primary[100],
      text: brand.primary[700],
    },
    outline: {
      bg: 'transparent',
      bgHover: brand.primary[50],
      border: brand.primary[500],
      text: brand.primary[600],
    },
    ghost: {
      bg: 'transparent',
      bgHover: colors.background.muted,
      text: colors.text.primary,
    },
  },

  card: {
    bg: colors.background.primary,
    border: colors.border.light,
    borderRadius: borderRadius.lg,
    shadow: shadows.sm,
    padding: spacing[6],
  },

  input: {
    bg: colors.background.primary,
    border: colors.border.medium,
    borderFocus: brand.primary[500],
    borderRadius: borderRadius.md,
    padding: `${spacing[2]} ${spacing[3]}`,
    text: colors.text.primary,
    placeholder: colors.text.muted,
  },

  badge: {
    borderRadius: borderRadius.full,
    padding: `${spacing[1]} ${spacing[2]}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
} as const;

// =============================================================================
// CSS VARIABLES EXPORT (for index.css)
// =============================================================================

export const cssVariables = {
  // Core theme
  '--background': '0 0% 100%',
  '--foreground': '24 10% 10%',
  '--card': '0 0% 100%',
  '--card-foreground': '24 10% 10%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '24 10% 10%',

  // Primary - Golden Amber
  '--primary': '40 100% 45%',
  '--primary-foreground': '0 0% 100%',

  // Secondary
  '--secondary': '40 30% 96%',
  '--secondary-foreground': '40 100% 30%',

  // Muted
  '--muted': '40 20% 96%',
  '--muted-foreground': '24 10% 45%',

  // Accent
  '--accent': '40 30% 94%',
  '--accent-foreground': '40 100% 30%',

  // Destructive
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',

  // Border & Input
  '--border': '24 10% 90%',
  '--input': '24 10% 90%',
  '--ring': '40 100% 45%',

  // Radius
  '--radius': '0.5rem',
} as const;

// =============================================================================
// TAILWIND THEME EXPORT
// =============================================================================

export const tailwindTheme = {
  colors: {
    brand: brand.primary,
    surface: colors.background,
    ...colors.frontDesk,
  },
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize,
  spacing,
  borderRadius,
  boxShadow: shadows,
  zIndex,
} as const;

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const MangoDesignSystem = {
  brand,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  components,
  cssVariables,
  tailwindTheme,
} as const;

export default MangoDesignSystem;
