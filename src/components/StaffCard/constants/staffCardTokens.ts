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
    borderColor: '#E0E0E0',
    darkBorderColor: '#C0C0C0',
    bgGradientFrom: '#FFFFFF',
    bgGradientTo: '#F5F5F5',
    textColor: '#424242',
    iconColor: '#757575',
  },
  nails: {
    base: '#F43F5E',
    borderColor: '#F43F5E',
    darkBorderColor: '#E11D48',
    bgGradientFrom: '#FFF1F3',
    bgGradientTo: '#FFE4E8',
    textColor: '#881337',
    iconColor: '#E11D48',
  },
  hair: {
    base: '#2563EB',
    borderColor: '#2563EB',
    darkBorderColor: '#1D4ED8',
    bgGradientFrom: '#EFF6FF',
    bgGradientTo: '#DBEAFE',
    textColor: '#1E3A8A',
    iconColor: '#1D4ED8',
  },
  massage: {
    base: '#16A34A',
    borderColor: '#16A34A',
    darkBorderColor: '#15803D',
    bgGradientFrom: '#F0FDF4',
    bgGradientTo: '#DCFCE7',
    textColor: '#14532D',
    iconColor: '#15803D',
  },
  skincare: {
    base: '#A855F7',
    borderColor: '#A855F7',
    darkBorderColor: '#9333EA',
    bgGradientFrom: '#FAF5FF',
    bgGradientTo: '#F3E8FF',
    textColor: '#581C87',
    iconColor: '#9333EA',
  },
  waxing: {
    base: '#06B6D4',
    borderColor: '#06B6D4',
    darkBorderColor: '#0891B2',
    bgGradientFrom: '#ECFEFF',
    bgGradientTo: '#CFFAFE',
    textColor: '#164E63',
    iconColor: '#0891B2',
  },
  combo: {
    base: '#EAB308',
    borderColor: '#EAB308',
    darkBorderColor: '#CA8A04',
    bgGradientFrom: '#FEFCE8',
    bgGradientTo: '#FEF08A',
    textColor: '#713F12',
    iconColor: '#CA8A04',
  },
  support: {
    base: '#F97316',
    borderColor: '#F97316',
    darkBorderColor: '#EA580C',
    bgGradientFrom: '#FFF7ED',
    bgGradientTo: '#FFEDD5',
    textColor: '#7C2D12',
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
    height: '160px',
    avatarSize: '44px',
    borderRadius: '50%',
    containerPadding: 'p-1',
    cardRadius: '16px',
  },
  compact: {
    width: '100%',
    height: '220px',
    avatarSize: '64px',
    borderRadius: '50%',
    containerPadding: 'p-2',
    cardRadius: '20px',
  },
  normal: {
    width: '100%',
    height: '320px',
    avatarSize: '100px',
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
    badge: isUltra ? '24px' : isCompact ? '34px' : '42px',
    badgeFont: isUltra ? '12px' : isCompact ? '16px' : '20px',
    notchHeight: isBusy ? (isUltra ? '28px' : '32px') : (isUltra ? '18px' : '24px'),
    nameSize: isUltra ? 'text-sm' : isCompact ? 'text-lg' : 'text-xl',
    metaSize: isUltra ? 'text-xs' : 'text-xs',
    iconSize: isUltra ? 9 : 11,
    borderWidth: isUltra ? '2px' : '4px',
    timelineText: isUltra ? 'text-xs' : 'text-xs',
    timelineGap: isUltra ? 'gap-1' : 'gap-3',
  };
};

// ============================================================================
// SHADOWS & EFFECTS
// ============================================================================

export const CARD_SHADOWS = {
  default: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
  busy: '0 4px 20px rgba(225, 29, 72, 0.15), 0 1px 4px rgba(225, 29, 72, 0.1)',
  hover: '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
  avatar: '0 8px 24px -6px rgba(0,0,0,0.15)',
};

export const BUSY_OVERLAY = {
  background: 'rgba(225, 29, 72, 0.35)',
  mixBlendMode: 'multiply' as const,
  filter: 'saturate(0.3)',
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
    return 'rgba(16, 185, 129, 0.03)';
  }
  if (progress <= 0.75) {
    return 'rgba(245, 158, 11, 0.03)';
  }
  return 'rgba(239, 68, 68, 0.03)';
};

// ============================================================================
// ANIMATION CONFIGS
// ============================================================================

export const ANIMATIONS = {
  cardHover: {
    transition: 'all 0.3s ease-out',
    transform: 'hover:-translate-y-1.5',
    shadow: 'hover:shadow-xl',
  },
  avatarHover: {
    transition: 'transform 0.3s',
    transform: 'group-hover:scale-[1.02]',
  },
  progressBar: {
    transition: 'all 0.7s ease-out',
  },
  pulseAnimation: 'animate-pulse',
};

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const LAYOUT = {
  topSectionHeight: '70%',
  bottomSectionHeight: '30%',
  notchWidthBusy: {
    ultra: '72%',
    normal: '60%',
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
