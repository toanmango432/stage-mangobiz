/**
 * Premium Design System for Book Module
 * World-class visual design tokens
 * Competitive with Square, Fresha, Calendly
 */

export const premiumDesignSystem = {
  // ============================================================================
  // COLORS - Sophisticated, Professional Palette
  // ============================================================================

  colors: {
    // Surface colors (blue-tinted neutrals, not pure gray)
    surface: {
      primary: '#FAFBFC',      // Slightly blue-tinted white
      secondary: '#F5F7FA',    // Card backgrounds
      tertiary: '#EDF1F7',     // Subtle sections
      elevated: '#FFFFFF',     // Raised cards (pure white)
    },

    // Refined teal (less saturated, more professional)
    brand: {
      50: '#EEFBF9',
      100: '#D6F5F1',
      200: '#ADE9E1',
      300: '#7DD8CF',
      400: '#4DC4BA',
      500: '#2AA79E',  // Main brand color
      600: '#1F8B83',
      700: '#186F69',
      800: '#145854',
      900: '#104743',
    },

    // Modern status colors (muted, professional)
    status: {
      scheduled: {
        bg: '#EEF2FF',        // Soft indigo
        bgLight: '#F5F7FF',
        border: '#C7D2FE',
        text: '#4F46E5',
        accent: '#6366F1',
      },
      checkedIn: {
        bg: '#ECFDF5',        // Soft green
        bgLight: '#F0FDF9',
        border: '#A7F3D0',
        text: '#047857',
        accent: '#10B981',
      },
      inService: {
        bg: '#FEF3C7',        // Soft amber
        bgLight: '#FEFCE8',
        border: '#FDE68A',
        text: '#B45309',
        accent: '#F59E0B',
      },
      completed: {
        bg: '#F0FDF4',        // Soft emerald
        bgLight: '#F7FEF9',
        border: '#BBF7D0',
        text: '#15803D',
        accent: '#22C55E',
      },
      cancelled: {
        bg: '#FEE2E2',        // Soft red
        bgLight: '#FEF2F2',
        border: '#FECACA',
        text: '#991B1B',
        accent: '#EF4444',
      },
      noShow: {
        bg: '#F3F4F6',        // Soft gray
        bgLight: '#F9FAFB',
        border: '#E5E7EB',
        text: '#6B7280',
        accent: '#9CA3AF',
      },
    },

    // Semantic colors
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },

    // Text colors (proper hierarchy)
    text: {
      primary: '#0F172A',      // Almost black (slate-900)
      secondary: '#475569',    // Medium gray (slate-600)
      tertiary: '#94A3B8',     // Light gray (slate-400)
      disabled: '#CBD5E1',     // Very light (slate-300)
      inverse: '#FFFFFF',      // On dark backgrounds
    },

    // Staff colors (varied, professional)
    staff: [
      '#2AA79E', // Teal
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#3B82F6', // Blue
      '#EF4444', // Red
      '#14B8A6', // Cyan
    ],
  },

  // ============================================================================
  // ELEVATION & DEPTH - Glass Morphism + Shadows
  // ============================================================================

  elevation: {
    // Glass morphism effects
    glass: {
      light: {
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
      },
      medium: {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.12)',
      },
      strong: {
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 16px 48px rgba(15, 23, 42, 0.16)',
      },
    },

    // Material Design inspired shadows
    shadow: {
      none: 'none',
      xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
      sm: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)',
      md: '0 2px 8px rgba(15, 23, 42, 0.1), 0 1px 3px rgba(15, 23, 42, 0.08)',
      lg: '0 4px 12px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.08)',
      xl: '0 8px 24px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.10)',
      '2xl': '0 16px 48px rgba(15, 23, 42, 0.16), 0 8px 24px rgba(15, 23, 42, 0.12)',
      '3xl': '0 24px 60px rgba(15, 23, 42, 0.18), 0 12px 30px rgba(15, 23, 42, 0.14)',
    },

    // Hover states (elevated shadows)
    hover: {
      sm: '0 2px 8px rgba(15, 23, 42, 0.12), 0 2px 4px rgba(15, 23, 42, 0.08)',
      md: '0 4px 16px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.10)',
      lg: '0 8px 24px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.12)',
    },
  },

  // ============================================================================
  // TYPOGRAPHY - Clear Hierarchy, Optimized Readability
  // ============================================================================

  typography: {
    // Font families
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, "Helvetica Neue", sans-serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
    },

    // Type scale (Major Third - 1.250 ratio)
    scale: {
      display: {
        fontSize: '36px',
        fontWeight: '700',
        lineHeight: '1.1',
        letterSpacing: '-0.02em',
      },
      h1: {
        fontSize: '28px',
        fontWeight: '700',
        lineHeight: '1.2',
        letterSpacing: '-0.01em',
      },
      h2: {
        fontSize: '22px',
        fontWeight: '600',
        lineHeight: '1.3',
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '18px',
        fontWeight: '600',
        lineHeight: '1.4',
        letterSpacing: '0',
      },
      h4: {
        fontSize: '16px',
        fontWeight: '600',
        lineHeight: '1.4',
        letterSpacing: '0',
      },
      large: {
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0',
      },
      body: {
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0',
      },
      small: {
        fontSize: '13px',
        fontWeight: '400',
        lineHeight: '1.4',
        letterSpacing: '0',
      },
      caption: {
        fontSize: '12px',
        fontWeight: '400',
        lineHeight: '1.4',
        letterSpacing: '0.01em',
      },
      tiny: {
        fontSize: '11px',
        fontWeight: '500',
        lineHeight: '1.3',
        letterSpacing: '0.02em',
        textTransform: 'uppercase' as const,
      },
    },

    // Font weights
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // ============================================================================
  // SPACING - 4px Grid System
  // ============================================================================

  spacing: {
    // Base unit (4px)
    base: 4,

    // Scale
    0: '0',
    1: '4px',     // 0.25rem
    2: '8px',     // 0.5rem
    3: '12px',    // 0.75rem
    4: '16px',    // 1rem
    5: '20px',    // 1.25rem
    6: '24px',    // 1.5rem
    8: '32px',    // 2rem
    10: '40px',   // 2.5rem
    12: '48px',   // 3rem
    16: '64px',   // 4rem
    20: '80px',   // 5rem
    24: '96px',   // 6rem

    // Component-specific (semantic)
    component: {
      padding: '24px',
      paddingMobile: '16px',
      gap: '16px',
      gapSmall: '12px',
      gapLarge: '24px',
    },

    // Layout
    layout: {
      sidebarWidth: '280px',
      sidebarCollapsedWidth: '80px',
      headerHeight: '72px',
      headerHeightMobile: '64px',
      maxContentWidth: '1600px',
    },
  },

  // ============================================================================
  // ANIMATION - Smooth, Natural Motion
  // ============================================================================

  animation: {
    // Duration (purpose-based)
    duration: {
      instant: '100ms',     // Hover states
      fast: '200ms',        // Small transitions
      normal: '300ms',      // Standard transitions
      slow: '500ms',        // Large transitions
      verySlow: '800ms',    // Modals, overlays
    },

    // Easing (natural motion)
    easing: {
      // Entrances (decelerate)
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',

      // Exits (accelerate)
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',

      // Standard (smooth)
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',

      // Spring (bouncy, playful)
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

      // Elastic (attention-grabbing)
      elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    // Presets (common animations)
    presets: {
      fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 },
        duration: '300ms',
        easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      slideUp: {
        from: { transform: 'translateY(20px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
        duration: '400ms',
        easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      slideDown: {
        from: { transform: 'translateY(-20px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
        duration: '400ms',
        easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      slideLeft: {
        from: { transform: 'translateX(20px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
        duration: '400ms',
        easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      slideRight: {
        from: { transform: 'translateX(-20px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
        duration: '400ms',
        easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      scale: {
        from: { transform: 'scale(0.9)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
        duration: '300ms',
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },

  // ============================================================================
  // BORDERS - Rounded Corners, Consistent Widths
  // ============================================================================

  borders: {
    radius: {
      none: '0',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      full: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px',
      heavy: '4px',
    },
  },

  // ============================================================================
  // BREAKPOINTS - Responsive Design
  // ============================================================================

  breakpoints: {
    xs: '375px',   // Small mobile
    sm: '640px',   // Mobile
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px', // Extra large
  },

  // ============================================================================
  // Z-INDEX - Layering System
  // ============================================================================

  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get status color object
 */
export function getStatusColor(status: string) {
  const statusMap: Record<string, any> = {
    scheduled: premiumDesignSystem.colors.status.scheduled,
    'checked-in': premiumDesignSystem.colors.status.checkedIn,
    'in-service': premiumDesignSystem.colors.status.inService,
    completed: premiumDesignSystem.colors.status.completed,
    cancelled: premiumDesignSystem.colors.status.cancelled,
    'no-show': premiumDesignSystem.colors.status.noShow,
  };
  return statusMap[status] || premiumDesignSystem.colors.status.scheduled;
}

/**
 * Get staff color by index
 */
export function getStaffColor(index: number): string {
  const colors = premiumDesignSystem.colors.staff;
  return colors[index % colors.length];
}

/**
 * Convert spacing value to CSS
 */
export function spacing(value: keyof typeof premiumDesignSystem.spacing): string {
  return premiumDesignSystem.spacing[value] as string;
}

// ============================================================================
// TAILWIND CLASS HELPERS
// ============================================================================

export const premiumClasses = {
  // Typography
  typography: {
    display: 'text-4xl font-bold tracking-tight',
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-2xl font-semibold tracking-tight',
    h3: 'text-lg font-semibold',
    h4: 'text-base font-semibold',
    large: 'text-base font-normal',
    body: 'text-sm font-normal',
    small: 'text-[13px] font-normal',
    caption: 'text-xs font-normal',
    tiny: 'text-[11px] font-medium uppercase tracking-wide',
  },

  // Transitions
  transition: {
    instant: 'transition-all duration-100',
    fast: 'transition-all duration-200',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
  },

  // Hover effects
  hover: {
    lift: 'hover:-translate-y-0.5 hover:shadow-md transition-all duration-200',
    scale: 'hover:scale-105 transition-transform duration-200',
    opacity: 'hover:opacity-80 transition-opacity duration-200',
  },

  // Glass morphism
  glass: {
    light: 'bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg',
    medium: 'bg-white/80 backdrop-blur-2xl border border-white/40 shadow-xl',
    strong: 'bg-white/90 backdrop-blur-3xl border border-white/50 shadow-2xl',
  },

  // Cards
  card: {
    base: 'bg-white rounded-xl border border-gray-200 shadow-sm',
    elevated: 'bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200',
    premium: 'bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200',
  },

  // Buttons (will be expanded in PremiumButton component)
  button: {
    base: 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base',
      xl: 'px-8 py-3 text-base',
    },
  },
};

// ============================================================================
// CSS-IN-JS HELPERS
// ============================================================================

/**
 * Generate CSS string from glass morphism object
 */
export function glassStyle(level: 'light' | 'medium' | 'strong' = 'medium') {
  const glass = premiumDesignSystem.elevation.glass[level];
  return {
    background: glass.background,
    backdropFilter: glass.backdropFilter,
    border: glass.border,
    boxShadow: glass.boxShadow,
  };
}

/**
 * Generate CSS string for shadow
 */
export function shadowStyle(size: keyof typeof premiumDesignSystem.elevation.shadow) {
  return premiumDesignSystem.elevation.shadow[size];
}

// Export default
export default premiumDesignSystem;
