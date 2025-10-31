/**
 * Mango 2.0 Design System
 * Best of Fresha's polish + Mango's features
 */

// ============================================================================
// COLOR PALETTE - Refined & Professional
// ============================================================================

export const colors = {
  // Primary Colors (Soft Teal - less harsh than original)
  primary: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA', // Main primary
    500: '#00BCD4',
    600: '#00ACC1',
    700: '#0097A7',
    800: '#00838F',
    900: '#006064',
  },

  // Secondary Colors (Soft Mint - replaces harsh lime green)
  secondary: {
    50: '#F1F8E9',
    100: '#DCEDC8',
    200: '#C5E1A5',
    300: '#AED581',
    400: '#9CCC65',
    500: '#8BC34A',
    600: '#7CB342',
    700: '#689F38',
    800: '#558B2F',
    900: '#33691E',
  },

  // Accent Colors (Coral Pink - for CTAs)
  accent: {
    50: '#FFE0EC',
    100: '#FFB3D0',
    200: '#FF80B3',
    300: '#FF4D96',
    400: '#FF6B9D', // Main accent
    500: '#F50057',
    600: '#C51162',
    700: '#AD1457',
    800: '#880E4F',
    900: '#560027',
  },

  // Appointment Colors (Soft, Professional - Fresha-inspired)
  appointment: {
    scheduled: '#C8E6C9',    // Very soft mint (lighter, more pastel)
    checkedIn: '#A5D6A7',    // Soft mint green
    inService: '#81C784',    // Medium green
    completed: '#E8F5E9',    // Very light green
    cancelled: '#FFCDD2',    // Soft pink-red
    noShow: '#FFE0B2',       // Soft orange
    blocked: '#CFD8DC',      // Light blue gray
  },

  // Status Colors
  status: {
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#42A5F5',
  },

  // Neutral Colors (Grays)
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    tertiary: '#FAFAFA',
    hover: '#F5F5F5',
    selected: '#E3F2FD',
  },

  // Text Colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },

  // Border Colors
  border: {
    light: '#EEEEEE',
    medium: '#E0E0E0',
    dark: '#BDBDBD',
  },
};

// ============================================================================
// SPACING - 8px Grid System (Like Fresha)
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

// ============================================================================
// TYPOGRAPHY - Clear Hierarchy
// ============================================================================

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// ============================================================================
// SHADOWS - Subtle Depth
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

// ============================================================================
// BORDER RADIUS - Consistent Rounding
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.375rem', // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

// ============================================================================
// TRANSITIONS - Smooth Animations
// ============================================================================

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================================================
// Z-INDEX - Layering System
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};

// ============================================================================
// CALENDAR SPECIFIC
// ============================================================================

export const calendar = {
  // Time Grid
  timeColumn: {
    width: '60px',
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },

  // Staff Column
  staffColumn: {
    minWidth: '200px',
    headerHeight: '80px',
  },

  // Time Slots
  timeSlot: {
    height: '60px', // 1 hour = 60px (15min = 15px)
    borderColor: colors.border.light,
  },

  // Current Time Indicator
  currentTime: {
    color: colors.primary[400],
    lineWidth: '2px',
    dotSize: '12px',
  },

  // Appointment Block
  appointmentBlock: {
    borderRadius: borderRadius.md,
    padding: spacing[3],
    shadow: shadows.sm,
    hoverShadow: shadows.md,
  },
};

// ============================================================================
// COMPONENT VARIANTS
// ============================================================================

export const button = {
  primary: {
    bg: colors.primary[400],
    hoverBg: colors.primary[500],
    text: colors.text.inverse,
  },
  secondary: {
    bg: colors.neutral[100],
    hoverBg: colors.neutral[200],
    text: colors.text.primary,
  },
  accent: {
    bg: colors.accent[400],
    hoverBg: colors.accent[500],
    text: colors.text.inverse,
  },
};

export const card = {
  bg: colors.background.primary,
  border: colors.border.light,
  borderRadius: borderRadius.lg,
  shadow: shadows.base,
  padding: spacing[6],
};
