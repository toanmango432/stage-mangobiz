/**
 * Design System - Typography Tokens
 * Premium typography system for Book module
 */

export const BOOK_TYPOGRAPHY = {
  // Font Family
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },

  // Font Sizes (rem)
  fontSize: {
    xs: '0.75rem',      // 12px - Labels, captions
    sm: '0.875rem',     // 14px - Body small, secondary text
    base: '1rem',       // 16px - Body text, default
    lg: '1.125rem',     // 18px - Subheadings, emphasized text
    xl: '1.25rem',      // 20px - Card titles, section headers
    '2xl': '1.5rem',    // 24px - Page section headers
    '3xl': '1.875rem',  // 30px - Page titles
    '4xl': '2.25rem',   // 36px - Hero text, dashboard headers
    '5xl': '3rem',      // 48px - Display text
  },

  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

/**
 * Predefined Text Styles
 * Common typography combinations for consistent usage
 */
export const TEXT_STYLES = {
  // Display Styles (Hero, Landing)
  display: {
    xl: {
      fontSize: BOOK_TYPOGRAPHY.fontSize['5xl'],
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.tight,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.bold,
      letterSpacing: BOOK_TYPOGRAPHY.letterSpacing.tight,
    },
    lg: {
      fontSize: BOOK_TYPOGRAPHY.fontSize['4xl'],
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.tight,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.bold,
      letterSpacing: BOOK_TYPOGRAPHY.letterSpacing.tight,
    },
    md: {
      fontSize: BOOK_TYPOGRAPHY.fontSize['3xl'],
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.tight,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.bold,
    },
  },

  // Headings
  heading: {
    h1: {
      fontSize: BOOK_TYPOGRAPHY.fontSize['3xl'],
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.tight,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.bold,
    },
    h2: {
      fontSize: BOOK_TYPOGRAPHY.fontSize['2xl'],
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.snug,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.bold,
    },
    h3: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.xl,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.snug,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.semibold,
    },
    h4: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.lg,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.semibold,
    },
    h5: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.base,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.semibold,
    },
    h6: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.sm,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.semibold,
    },
  },

  // Body Text
  body: {
    lg: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.lg,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.relaxed,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.normal,
    },
    base: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.base,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.normal,
    },
    sm: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.sm,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.normal,
    },
    xs: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.xs,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.normal,
    },
  },

  // Labels (forms, buttons)
  label: {
    lg: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.base,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.medium,
    },
    base: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.sm,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.medium,
    },
    sm: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.xs,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.medium,
    },
  },

  // Captions (hints, metadata)
  caption: {
    base: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.xs,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.normal,
    },
    bold: {
      fontSize: BOOK_TYPOGRAPHY.fontSize.xs,
      lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
      fontWeight: BOOK_TYPOGRAPHY.fontWeight.semibold,
    },
  },

  // Overline (section labels, categories)
  overline: {
    fontSize: BOOK_TYPOGRAPHY.fontSize.xs,
    lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
    fontWeight: BOOK_TYPOGRAPHY.fontWeight.semibold,
    letterSpacing: BOOK_TYPOGRAPHY.letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },

  // Code/Mono
  code: {
    fontSize: BOOK_TYPOGRAPHY.fontSize.sm,
    fontFamily: BOOK_TYPOGRAPHY.fontFamily.mono,
    lineHeight: BOOK_TYPOGRAPHY.lineHeight.normal,
  },
} as const;

/**
 * Helper function to get text style CSS
 */
export function getTextStyle(
  category: keyof typeof TEXT_STYLES,
  variant: string
): React.CSSProperties {
  const styles = TEXT_STYLES[category] as any;
  return styles[variant] || {};
}

/**
 * Truncate text styles
 */
export const TRUNCATE_STYLES = {
  // Single line
  single: {
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },

  // Multiple lines (CSS clamp)
  multi: (lines: number) => ({
    display: '-webkit-box' as const,
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden' as const,
  }),
} as const;

// Export types for TypeScript
export type FontSize = keyof typeof BOOK_TYPOGRAPHY.fontSize;
export type FontWeight = keyof typeof BOOK_TYPOGRAPHY.fontWeight;
export type LineHeight = keyof typeof BOOK_TYPOGRAPHY.lineHeight;
export type TextStyleCategory = keyof typeof TEXT_STYLES;
