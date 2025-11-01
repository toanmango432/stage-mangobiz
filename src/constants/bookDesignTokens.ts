/**
 * Book Module Design Tokens
 * Complete design system for appointments calendar
 * Competitive with Fresha, Mangomint, Booksy
 */

export const bookDesignTokens = {
  // COLORS - Extended Status System
  colors: {
    // Base colors (matches Front Desk)
    base: {
      bg: '#FFF9F4',        // Soft ivory
      hover: '#FFFCF9',     // 2% lighter
      selected: '#FFF6EF',  // Warmer
    },
    
    // Primary teal (keep existing brand)
    primary: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6',  // Main
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
    },
    
    // Status colors (industry standard)
    status: {
      confirmed: {
        bg: '#DCFCE7',
        bgLight: '#F0FDF4',
        border: '#86EFAC',
        text: '#166534',
        icon: '#22C55E',
      },
      pending: {
        bg: '#FEF3C7',
        bgLight: '#FEFCE8',
        border: '#FDE68A',
        text: '#92400E',
        icon: '#F59E0B',
      },
      cancelled: {
        bg: '#FEE2E2',
        bgLight: '#FEF2F2',
        border: '#FECACA',
        text: '#991B1B',
        icon: '#EF4444',
      },
      completed: {
        bg: '#E0E7FF',
        bgLight: '#EEF2FF',
        border: '#C7D2FE',
        text: '#3730A3',
        icon: '#6366F1',
      },
      walkin: {
        bg: '#DBEAFE',
        bgLight: '#EFF6FF',
        border: '#BFDBFE',
        text: '#1E3A8A',
        icon: '#3B82F6',
      },
    },
    
    // Calendar specific
    calendar: {
      gridBg: '#F9FAFB',          // Subtle gray background
      gridLine: 'rgba(0,0,0,0.08)', // Visible grid lines
      slotHover: '#F0FDFA',        // Teal-50
      slotSelected: '#CCFBF1',     // Teal-100
      slotDisabled: '#F3F4F6',     // Gray-100
      appointmentBg: '#FFFFFF',     // White cards
      timeLabel: '#6B7280',        // Gray-600
      currentTime: '#EF4444',      // Red line
    },
    
    // Staff avatars (varied colors)
    staff: {
      colors: ['#14B8A6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'], 
      selectedBg: '#F0FDFA',
      selectedBorder: '#14B8A6',
      statusActive: '#22C55E',
      statusBusy: '#F59E0B',
    },
  },
  
  // TYPOGRAPHY - Clear hierarchy
  typography: {
    scale: {
      h1: { size: '24px', weight: '600', lineHeight: '1.2' },
      h2: { size: '18px', weight: '600', lineHeight: '1.3' },
      h3: { size: '16px', weight: '500', lineHeight: '1.4' },
      body: { size: '14px', weight: '400', lineHeight: '1.5' },
      caption: { size: '12px', weight: '400', lineHeight: '1.4' },
      tiny: { size: '10px', weight: '400', lineHeight: '1.3' },
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  
  // SHADOWS - Depth system
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    lg: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    xl: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    
    // Hover states (elevated)
    hover: {
      sm: '0 2px 4px rgba(0, 0, 0, 0.08)',
      md: '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.25)',
      lg: '0 6px 12px rgba(0, 0, 0, 0.20), 0 4px 8px rgba(0, 0, 0, 0.25)',
    },
  },
  
  // SPACING - 8px grid system
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },
  
  // MOTION - Smooth transitions
  motion: {
    duration: {
      instant: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    },
  },
  
  // BORDERS
  borders: {
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px',
      heavy: '4px',
    },
  },
};

// Utility functions for easy access
export const getStatusColor = (status: string) => {
  const statusMap: Record<string, any> = {
    confirmed: bookDesignTokens.colors.status.confirmed,
    pending: bookDesignTokens.colors.status.pending,
    cancelled: bookDesignTokens.colors.status.cancelled,
    completed: bookDesignTokens.colors.status.completed,
    walkin: bookDesignTokens.colors.status.walkin,
  };
  return statusMap[status] || bookDesignTokens.colors.status.pending;
};

export const getStaffColor = (index: number) => {
  const colors = bookDesignTokens.colors.staff.colors;
  return colors[index % colors.length];
};

// Tailwind class helpers
export const typography = {
  h1: 'text-2xl font-semibold',
  h2: 'text-lg font-semibold',
  h3: 'text-base font-medium',
  body: 'text-sm font-normal',
  caption: 'text-xs font-normal',
  tiny: 'text-[10px] font-normal',
};

export const transitions = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
};
