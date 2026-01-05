/**
 * Staff Card Design Tokens
 * Centralized design system for staff cards
 */

// ============================================================================
// SPECIALTY COLORS - Integrated with design system
// ============================================================================

export interface SpecialtyColors {
  base: string;
  borderColor: string;
  darkBorderColor: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  textColor: string;
  iconColor: string;
}

export const SPECIALTY_COLORS: Record<string, SpecialtyColors> = {
  neutral: {
    base: '#F5F5F5',
    borderColor: '#E5E5E5',
    darkBorderColor: '#D4D4D4',
    bgGradientFrom: '#FFFFFF',
    bgGradientTo: '#F8FAFC',
    textColor: '#525252',
    iconColor: '#737373',
  },
  nails: {
    base: '#F43F5E',
    borderColor: '#FDA4AF',
    darkBorderColor: '#FB7185',
    bgGradientFrom: '#FFF1F2',
    bgGradientTo: '#FFE4E6',
    textColor: '#9F1239',
    iconColor: '#E11D48',
  },
  hair: {
    base: '#3B82F6',
    borderColor: '#93C5FD',
    darkBorderColor: '#60A5FA',
    bgGradientFrom: '#EFF6FF',
    bgGradientTo: '#DBEAFE',
    textColor: '#1E40AF',
    iconColor: '#2563EB',
  },
  massage: {
    base: '#10B981',
    borderColor: '#6EE7B7',
    darkBorderColor: '#34D399',
    bgGradientFrom: '#ECFDF5',
    bgGradientTo: '#D1FAE5',
    textColor: '#065F46',
    iconColor: '#059669',
  },
  skincare: {
    base: '#8B5CF6',
    borderColor: '#C4B5FD',
    darkBorderColor: '#A78BFA',
    bgGradientFrom: '#F5F3FF',
    bgGradientTo: '#EDE9FE',
    textColor: '#5B21B6',
    iconColor: '#7C3AED',
  },
  waxing: {
    base: '#06B6D4',
    borderColor: '#67E8F9',
    darkBorderColor: '#22D3EE',
    bgGradientFrom: '#ECFEFF',
    bgGradientTo: '#CFFAFE',
    textColor: '#155E75',
    iconColor: '#0891B2',
  },
  combo: {
    base: '#F59E0B',
    borderColor: '#FCD34D',
    darkBorderColor: '#FBBF24',
    bgGradientFrom: '#FFFBEB',
    bgGradientTo: '#FEF3C7',
    textColor: '#92400E',
    iconColor: '#D97706',
  },
  support: {
    base: '#F97316',
    borderColor: '#FDBA74',
    darkBorderColor: '#FB923C',
    bgGradientFrom: '#FFF7ED',
    bgGradientTo: '#FFEDD5',
    textColor: '#9A3412',
    iconColor: '#EA580C',
  },
};

// ============================================================================
// STATUS COLORS & CONFIGURATIONS
// ============================================================================

export interface StatusConfig {
  bg: string;
  text: string;
  lightText: string;
  border: string;
  ring: string;
  label: string;
  isBusy: boolean;
}

export const STATUS_COLORS = {
  ready: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-700',
    lightText: 'text-emerald-50',
    border: 'border-emerald-200',
    ring: 'ring-emerald-400',
    label: 'Ready',
    isBusy: false,
  },
  busy: {
    bg: 'bg-rose-500',
    text: 'text-rose-700',
    lightText: 'text-rose-50',
    border: 'border-rose-200',
    ring: 'ring-rose-400',
    label: 'Busy',
    isBusy: true,
  },
  off: {
    bg: 'bg-gray-400',
    text: 'text-gray-600',
    lightText: 'text-gray-50',
    border: 'border-gray-200',
    ring: 'ring-gray-300',
    label: 'Off',
    isBusy: false,
  },
} as const;

// ============================================================================
// CARD DIMENSIONS BY VIEW MODE
// ============================================================================

export interface CardDimensions {
  width: string;
  height: string;
  avatarSize: string;
  borderRadius: string;
  containerPadding: string;
  cardRadius: string;
}

export const CARD_DIMENSIONS: Record<'ultra-compact' | 'compact' | 'normal', CardDimensions> = {
  'ultra-compact': {
    width: '100%',
    height: '85px', // Reduced from 170px for maximum density
    avatarSize: '50px', // Reduced from 70px
    borderRadius: '50%',
    containerPadding: 'p-1', // Reduced from p-1.5
    cardRadius: '12px', // Reduced from 16px
  },
  compact: {
    width: '100%',
    height: '190px', // Increased from 170px to show metrics
    avatarSize: '70px',
    borderRadius: '50%',
    containerPadding: 'p-1.5',
    cardRadius: '16px',
  },
  normal: {
    width: '100%',
    height: '280px', // Optimized from 300px
    avatarSize: '130px', // Optimized from 140px
    borderRadius: '50%',
    containerPadding: 'p-3',
    cardRadius: '24px',
  },
};

// ============================================================================
// RESPONSIVE SIZING TOKENS
// ============================================================================

export interface ResponsiveSizes {
  badge: string;
  badgeFont: string;
  notchHeight: string;
  nameSize: string;
  metaSize: string;
  iconSize: number;
  borderWidth: string;
  timelineText: string;
  timelineGap: string;
}

export const getResponsiveSizes = (
  viewMode: 'ultra-compact' | 'compact' | 'normal',
  isBusy: boolean
): ResponsiveSizes => {
  const isUltra = viewMode === 'ultra-compact';
  const isCompact = viewMode === 'compact';

  return {
    badge: isUltra ? '20px' : isCompact ? '28px' : '36px', // Increased from 16px for ultra
    badgeFont: isUltra ? '11px' : isCompact ? '14px' : '16px', // Increased from 9px
    notchHeight: isBusy ? (isUltra ? '9px' : '28px') : (isUltra ? '8px' : '20px'), // Reduced by 20% for ultra
    nameSize: isUltra ? 'text-[13px]' : isCompact ? 'text-[14px]' : 'text-[18px]', // Slightly increased for normal
    metaSize: isUltra ? 'text-[9px]' : isCompact ? 'text-[11px]' : 'text-xs', // Slightly larger for compact
    iconSize: isUltra ? 10 : isCompact ? 12 : 14, // Balanced icon size
    borderWidth: isUltra ? '2px' : '4px',
    timelineText: isUltra ? 'text-[11px]' : isCompact ? 'text-[10px]' : 'text-xs', // Increased from 9px
    timelineGap: isUltra ? 'gap-0.5' : 'gap-2', // Reduced from gap-1
  };
};

// ============================================================================
// SHADOWS & EFFECTS
// ============================================================================

// ============================================================================
// SHADOWS & EFFECTS
// ============================================================================

export const CARD_SHADOWS = {
  default: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
  busy: '0 10px 30px -5px rgba(225, 29, 72, 0.2), 0 4px 12px -4px rgba(225, 29, 72, 0.1), inset 0 0 0 1px rgba(225, 29, 72, 0.3)',
  hover: '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 8px 16px -6px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  avatar: '0 20px 40px -12px rgba(0,0,0,0.25), 0 8px 16px -8px rgba(0,0,0,0.3)',
  innerGlow: 'inset 0 0 20px rgba(255, 255, 255, 0.5)',
};

export const GLASS_EFFECTS = {
  card: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  },
  overlay: {
    background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%)',
  },
  busyOverlay: {
    background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.1) 0%, rgba(225, 29, 72, 0.05) 100%)',
    backdropFilter: 'blur(2px)',
  }
};

export const BUSY_OVERLAY = {
  background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.15), rgba(225, 29, 72, 0.05))',
  mixBlendMode: 'normal' as const,
  filter: 'none',
};

// ============================================================================
// PROGRESS BAR COLORS
// ============================================================================

export const getProgressColor = (progress: number): string => {
  if (progress <= 0.25) return '#10B981'; // Green - just started
  if (progress <= 0.75) return '#F59E0B'; // Amber - in progress
  return '#EF4444'; // Red - almost done
};

export const getProgressGradient = (progress: number): string => {
  if (progress <= 0.25) {
    return 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2))';
  }
  if (progress <= 0.75) {
    return 'linear-gradient(90deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.2))';
  }
  return 'linear-gradient(90deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.2))';
};

// ============================================================================
// ANIMATION CONFIGS
// ============================================================================

export const ANIMATIONS = {
  cardHover: {
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring-like
    transform: 'hover:-translate-y-2',
    shadow: 'hover:shadow-2xl',
  },
  avatarHover: {
    transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'group-hover:scale-[1.05]',
  },
  progressBar: {
    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  pulseAnimation: 'animate-pulse',
  shimmer: 'animate-shimmer',
};

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const LAYOUT = {
  topSectionHeight: '80%',
  bottomSectionHeight: '20%',
  notchWidthBusy: {
    ultra: '72%',
    normal: '78%', // Increased to prevent % cutoff
  },
  notchWidthReady: {
    ultra: '50%',
    normal: '35%',
  },
  dividerOpacity: 0.5,
};

// ============================================================================
// TICKET CARD STYLES
// ============================================================================

export const TICKET_STYLES = {
  statusColors: {
    'in-service': '#34D399',
    pending: '#FBBF24',
  },
  background: {
    from: '#FFFBF0',
    to: '#FFF8E7',
  },
  border: {
    color: '#E5E7EB',
    style: 'dashed',
    width: '2px',
  },
  perforation: {
    size: '5px',
    position: '4px',
  },
  shadow: '0 2px 4px -1px rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  textureOpacity: 0.04,
  textureUrl: 'https://www.transparenttextures.com/patterns/white-paper.png',
};

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const A11Y = {
  minTouchTarget: '44px',
  focusRing: 'focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
};

// ============================================================================
// BREAKPOINTS (for container queries)
// ============================================================================

export const CONTAINER_BREAKPOINTS = {
  xs: 120,   // Ultra compact
  sm: 160,   // Compact
  md: 200,   // Normal
  lg: 240,   // Comfortable
  xl: 280,   // Spacious
};
