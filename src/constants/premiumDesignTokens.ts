/**
 * Premium Design Tokens for Mango Front Desk
 * 
 * Unified design system for elevated, handcrafted interface
 * that maintains paper-ticket charm while achieving premium polish.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const PremiumColors = {
  // Base paper ticket colors
  paper: {
    base: '#FFF9F4',           // Soft ivory base for all tickets
    hover: '#FFFCF9',          // 2% lighter on hover
    selected: '#FFF6EF',       // Slightly warmer when selected
    texture: 'rgba(0,0,0,0.04)', // Subtle texture overlay
  },

  // Status indicators (pastel, low saturation)
  status: {
    waiting: {
      primary: '#FFE7B3',      // Light amber
      hover: '#FFD280',        // Darker amber on hover
      icon: '#D97706',         // Amber-600 for icons
      bg: 'rgba(255, 231, 179, 0.1)', // Ultra-light fill
    },
    inService: {
      primary: '#C9F3D1',      // Soft mint green
      hover: '#A5E8B0',        // Darker mint on hover
      icon: '#059669',         // Emerald-600 for icons
      bg: 'rgba(201, 243, 209, 0.1)', // Ultra-light fill
    },
    pending: {
      primary: '#ECECEC',      // Light gray
      hover: '#D4D4D4',        // Darker gray on hover
      icon: '#6B7280',         // Gray-500 for icons
      bg: 'rgba(236, 236, 236, 0.1)', // Ultra-light fill
    },
    completed: {
      primary: '#D1F4E0',      // Light green
      hover: '#B7F0D0',        // Darker green on hover
      icon: '#10B981',         // Green-500 for icons
      bg: 'rgba(209, 244, 224, 0.1)', // Ultra-light fill
    },
  },

  // Client type badges (Apple-style subtle)
  badges: {
    vip: {
      bg: '#FFF9E6',
      text: '#8B6914',
      border: '#E5D4A0',
      icon: '⭐',
      accent: '#F59E0B',
    },
    priority: {
      bg: '#FFF1F0',
      text: '#B91C1C',
      border: '#FCA5A5',
      icon: '🔥',
      accent: '#EF4444',
    },
    new: {
      bg: '#EEF2FF',
      text: '#4338CA',
      border: '#C7D2FE',
      icon: '✨',
      accent: '#6366F1',
    },
    regular: {
      bg: '#F9FAFB',
      text: '#4B5563',
      border: '#E5E7EB',
      icon: '👤',
      accent: '#6B7280',
    },
  },

  // Typography colors
  text: {
    primary: '#111827',        // Gray-900 for main text
    secondary: '#6B7280',      // Gray-500 for service descriptions
    tertiary: '#9CA3AF',       // Gray-400 for metadata
    muted: '#D1D5DB',          // Gray-300 for subtle text
    inverse: '#FFFFFF',        // White for badges/buttons
  },

  // Borders and dividers
  borders: {
    light: 'rgba(0, 0, 0, 0.06)',    // Subtle borders
    medium: 'rgba(0, 0, 0, 0.1)',    // Standard borders
    heavy: 'rgba(0, 0, 0, 0.15)',    // Emphasized borders
    accent: 'rgba(0, 0, 0, 0.08)',   // Accent borders
  },

  // Shadows (layered for depth)
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
    md: '0 2px 4px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.08)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.12), 0 16px 32px rgba(0, 0, 0, 0.1)',
  },

  // Inset highlights (paper sheen effect)
  insets: {
    subtle: 'inset 0 0 0 1px rgba(255, 255, 255, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
    strong: 'inset 0 0 0 1px rgba(255, 255, 255, 0.9), inset 0 1px 1px rgba(255, 255, 255, 1)',
  },

  // Interactive states
  interactive: {
    hoverBg: 'rgba(0, 0, 0, 0.02)',   // Subtle hover background
    activeBg: 'rgba(0, 0, 0, 0.04)',  // Active/pressed background
    focusRing: '#3B82F6',             // Blue-500 for focus
    dragOver: 'rgba(59, 130, 246, 0.1)', // Blue tint for drop zones
  },

  // Progress indicators
  progress: {
    background: 'rgba(0, 0, 0, 0.08)',
    fill: {
      start: '#3B82F6',       // Blue-500
      middle: '#8B5CF6',      // Purple-500
      end: '#10B981',         // Green-500
    },
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const PremiumTypography = {
  // Font families
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
  },

  // Font sizes
  fontSize: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.5px',
    tight: '-0.2px',
    normal: '0',
    wide: '0.3px',
    wider: '0.5px',
  },

  // Text hierarchy (ticket specific)
  ticketText: {
    number: {
      fontSize: '16px',
      fontWeight: 700,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
      letterSpacing: '-0.5px',
      color: '#111827',
    },
    clientName: {
      fontSize: '14px',
      fontWeight: 600,
      letterSpacing: '-0.2px',
      color: '#111827',
    },
    service: {
      fontSize: '12px',
      fontWeight: 500,
      color: '#6B7280',
    },
    metadata: {
      fontSize: '10px',
      fontWeight: 500,
      color: '#9CA3AF',
    },
  },
} as const;

// ============================================================================
// SPACING & SIZING
// ============================================================================

export const PremiumSpacing = {
  // Card dimensions
  card: {
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
  },

  // Status indicator strip
  statusStrip: {
    width: '5px',
    borderRadius: '0',
  },

  // Section spacing
  section: {
    padding: '16px',
    gap: '12px',
    marginBottom: '16px',
  },

  // Grid layout
  grid: {
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
    },
    gap: {
      mobile: '8px',
      tablet: '12px',
      desktop: '16px',
    },
  },
} as const;

// ============================================================================
// MOTION & ANIMATION
// ============================================================================

export const PremiumMotion = {
  // Transition durations
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
  },

  // Easing functions
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',      // Smooth deceleration
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',          // Smooth acceleration
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',     // Smooth both
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',   // Springy effect
  },

  // Elevation on hover
  elevation: {
    lift: 'translateY(-2px)',
    press: 'translateY(0px) scale(0.99)',
  },

  // Progress animation
  progress: {
    duration: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Drag states
  drag: {
    scale: 'scale(1.02)',
    opacity: '0.9',
    shadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  },
} as const;

// ============================================================================
// COMPONENT-SPECIFIC STYLES
// ============================================================================

export const PremiumComponents = {
  // Ticket card base style
  ticketCard: {
    base: {
      background: PremiumColors.paper.base,
      borderRadius: PremiumSpacing.card.borderRadius.sm,
      border: `1px solid ${PremiumColors.borders.light}`,
      boxShadow: PremiumColors.shadows.sm,
      transition: `all ${PremiumMotion.duration.normal} ${PremiumMotion.easing.easeOut}`,
    },
    hover: {
      background: PremiumColors.paper.hover,
      boxShadow: PremiumColors.shadows.md,
      transform: PremiumMotion.elevation.lift,
    },
    selected: {
      background: PremiumColors.paper.selected,
      boxShadow: PremiumColors.shadows.lg,
      borderColor: PremiumColors.borders.accent,
    },
    dragging: {
      opacity: PremiumMotion.drag.opacity,
      transform: PremiumMotion.drag.scale,
      boxShadow: PremiumMotion.drag.shadow,
    },
  },

  // Status icons (right-aligned)
  statusIcon: {
    size: {
      compact: '14px',
      normal: '16px',
      large: '20px',
    },
    position: 'right',
    opacity: 0.6,
  },

  // Progress bar
  progressBar: {
    height: '3px',
    borderRadius: '999px',
    position: 'bottom',
    transition: `width ${PremiumMotion.progress.duration} ${PremiumMotion.progress.easing}`,
  },

  // Drop zone
  dropZone: {
    border: `2px dashed ${PremiumColors.interactive.focusRing}`,
    background: PremiumColors.interactive.dragOver,
    borderRadius: PremiumSpacing.card.borderRadius.md,
    padding: '16px',
    minHeight: '80px',
  },

  // Metrics card
  metricsCard: {
    background: PremiumColors.paper.base,
    borderRadius: PremiumSpacing.card.borderRadius.md,
    padding: '12px 16px',
    boxShadow: PremiumColors.shadows.sm,
    border: `1px solid ${PremiumColors.borders.light}`,
    cursor: 'pointer',
    transition: `all ${PremiumMotion.duration.fast} ${PremiumMotion.easing.easeOut}`,
    hover: {
      background: PremiumColors.paper.hover,
      boxShadow: PremiumColors.shadows.md,
      borderColor: PremiumColors.borders.medium,
    },
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get status color based on ticket state
 */
export function getStatusColors(status: 'waiting' | 'in-service' | 'pending' | 'completed') {
  return PremiumColors.status[status === 'in-service' ? 'inService' : status];
}

/**
 * Get badge colors based on client type
 */
export function getBadgeColors(clientType: 'VIP' | 'Priority' | 'New' | 'Regular') {
  return PremiumColors.badges[clientType.toLowerCase() as keyof typeof PremiumColors.badges];
}

/**
 * Generate combined shadow with inset highlights
 */
export function getCombinedShadow(elevation: 'sm' | 'md' | 'lg' | 'xl', withInset: boolean = true) {
  const shadow = PremiumColors.shadows[elevation];
  if (withInset) {
    return `${shadow}, ${PremiumColors.insets.subtle}`;
  }
  return shadow;
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(progress: number): string {
  if (progress < 33) return PremiumColors.progress.fill.start;
  if (progress < 66) return PremiumColors.progress.fill.middle;
  return PremiumColors.progress.fill.end;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export const PremiumDesignSystem = {
  colors: PremiumColors,
  typography: PremiumTypography,
  spacing: PremiumSpacing,
  motion: PremiumMotion,
  components: PremiumComponents,
  utils: {
    getStatusColors,
    getBadgeColors,
    getCombinedShadow,
    getProgressColor,
  },
} as const;

export default PremiumDesignSystem;
