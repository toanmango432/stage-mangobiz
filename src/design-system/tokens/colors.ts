/**
 * Design System - Color Tokens
 * Premium color palette for Book module
 *
 * NOTE: Primary color is Golden Amber to align with main design system.
 * See src/design-system/tokens.ts for the single source of truth.
 */

import { brand } from '../tokens';

export const BOOK_COLORS = {
  // Primary - Golden Amber (premium, mango brand)
  // Referenced from main tokens.ts for consistency
  primary: brand.primary,

  // Secondary - Purple (premium, luxury)
  secondary: {
    50: '#FAF5FF',
    100: '#E9D5FF',
    200: '#D8B4FE',
    300: '#C084FC',
    400: '#A855F7',
    500: '#9333EA',  // Main secondary color
    600: '#7E22CE',
    700: '#6B21A8',
    800: '#581C87',
    900: '#3B0764',
    950: '#2E0051',
  },

  // Status Colors (semantic)
  status: {
    scheduled: {
      bg: '#E0F2FE',
      fg: '#075985',
      border: '#93C5FD',
      label: 'Scheduled',
    },
    confirmed: {
      bg: '#DCFCE7',
      fg: '#166534',
      border: '#86EFAC',
      label: 'Confirmed',
    },
    requested: {
      bg: '#FEF3C7',
      fg: '#92400E',
      border: '#FCD34D',
      label: 'Requested',
    },
    'in-progress': {
      bg: '#F3E8FF',
      fg: '#6B21A8',
      border: '#D8B4FE',
      label: 'In Service',
    },
    'checked-in': {
      bg: '#CFFAFE',
      fg: '#155E75',
      border: '#67E8F9',
      label: 'Checked In',
    },
    completed: {
      bg: '#F1F5F9',
      fg: '#334155',
      border: '#CBD5E1',
      label: 'Completed',
    },
    cancelled: {
      bg: '#FEE2E2',
      fg: '#991B1B',
      border: '#FCA5A5',
      label: 'Cancelled',
    },
    'no-show': {
      bg: '#FFEDD5',
      fg: '#9A3412',
      border: '#FDBA74',
      label: 'No Show',
    },
  },

  // Service Categories (vibrant, distinct)
  categories: {
    hair: {
      main: '#EC4899',     // Pink
      light: '#FCE7F3',
      dark: '#BE185D',
    },
    nails: {
      main: '#F97316',     // Orange
      light: '#FFEDD5',
      dark: '#C2410C',
    },
    facial: {
      main: '#8B5CF6',     // Purple
      light: '#F3E8FF',
      dark: '#6B21A8',
    },
    massage: {
      main: '#06B6D4',     // Cyan
      light: '#CFFAFE',
      dark: '#0E7490',
    },
    waxing: {
      main: '#10B981',     // Green
      light: '#D1FAE5',
      dark: '#047857',
    },
    makeup: {
      main: '#F43F5E',     // Rose
      light: '#FFE4E6',
      dark: '#BE123C',
    },
    skincare: {
      main: '#A855F7',     // Violet
      light: '#F3E8FF',
      dark: '#7E22CE',
    },
    spa: {
      main: '#E6A000',     // Golden Amber (brand)
      light: '#FEF3D8',
      dark: '#A67300',
    },
  },

  // Neutral Grays (refined, modern)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  // Semantic Colors
  semantic: {
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#047857',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#B91C1C',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#B45309',
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#1E40AF',
    },
  },

  // Client Type Colors
  clientType: {
    new: {
      main: '#FBBF24',     // Amber
      light: '#FEF3C7',
      label: 'New Client',
    },
    vip: {
      main: '#F59E0B',     // Gold
      light: '#FEF3C7',
      label: 'VIP',
    },
    regular: {
      main: '#3B82F6',     // Blue
      light: '#DBEAFE',
      label: 'Regular',
    },
    returning: {
      main: '#10B981',     // Green
      light: '#D1FAE5',
      label: 'Returning',
    },
  },

  // Booking Source Colors
  source: {
    online: '#26C6DA',
    'walk-in': '#66BB6A',
    phone: '#7E57C2',
    app: '#EC4899',
    default: '#E6A000',  // Golden Amber (brand)
  },

  // Value-Based Colors (for pricing tiers)
  value: {
    low: {
      main: '#94A3B8',     // Slate
      label: 'Standard',
    },
    medium: {
      main: '#3B82F6',     // Blue
      label: 'Premium',
    },
    high: {
      main: '#8B5CF6',     // Purple
      label: 'Luxury',
    },
    veryHigh: {
      main: '#EC4899',     // Pink
      label: 'Elite',
    },
  },
} as const;

/**
 * Helper function to get status color
 */
export function getStatusColor(status: string) {
  const statusKey = status as keyof typeof BOOK_COLORS.status;
  return BOOK_COLORS.status[statusKey] || BOOK_COLORS.status.scheduled;
}

/**
 * Helper function to get category color
 */
export function getCategoryColor(category: string) {
  const normalizedCategory = category.toLowerCase();
  const categoryKey = normalizedCategory as keyof typeof BOOK_COLORS.categories;
  return BOOK_COLORS.categories[categoryKey] || {
    main: BOOK_COLORS.neutral[500],
    light: BOOK_COLORS.neutral[100],
    dark: BOOK_COLORS.neutral[700],
  };
}

/**
 * Helper function to get source color
 */
export function getSourceColor(source: string) {
  const sourceKey = source as keyof typeof BOOK_COLORS.source;
  return BOOK_COLORS.source[sourceKey] || BOOK_COLORS.source.default;
}

/**
 * Helper function to get client type color
 */
export function getClientTypeColor(type: string) {
  const typeKey = type as keyof typeof BOOK_COLORS.clientType;
  return BOOK_COLORS.clientType[typeKey] || BOOK_COLORS.clientType.regular;
}

/**
 * Helper function to get value-based color
 */
export function getValueColor(amount: number): { readonly main: string; readonly label: string } {
  if (amount >= 300) return BOOK_COLORS.value.veryHigh;
  if (amount >= 200) return BOOK_COLORS.value.high;
  if (amount >= 100) return BOOK_COLORS.value.medium;
  return BOOK_COLORS.value.low;
}

// Export type for TypeScript autocomplete
export type StatusKey = keyof typeof BOOK_COLORS.status;
export type CategoryKey = keyof typeof BOOK_COLORS.categories;
export type SourceKey = keyof typeof BOOK_COLORS.source;
export type ClientTypeKey = keyof typeof BOOK_COLORS.clientType;
