/**
 * Ticket Panel Design Tokens
 *
 * A consistent design system for the Ticket Panel components.
 * Based on 8px grid spacing system.
 *
 * Usage:
 *   import { TicketPanelTokens } from '@/constants/ticketPanelTokens';
 *   className={TicketPanelTokens.typography.staffName}
 */

export const TicketPanelTokens = {
  // Spacing scale based on 8px grid
  spacing: {
    xs: 'space-x-1',     // 4px - icon gaps, inline spacing
    sm: 'space-x-2',     // 8px - tight gaps between related items
    md: 'space-x-3',     // 12px - default component gaps
    lg: 'space-x-4',     // 16px - card internal padding
    xl: 'space-x-6',     // 24px - section separation
    xxl: 'space-x-8',    // 32px - major section gaps
  },

  // Padding/margin variants
  padding: {
    xs: 'p-1',           // 4px
    sm: 'p-2',           // 8px
    md: 'p-3',           // 12px
    lg: 'p-4',           // 16px
    xl: 'p-5',           // 20px
    xxl: 'p-6',          // 24px
  },

  // Gap variants for flex/grid
  gap: {
    xs: 'gap-1',         // 4px
    sm: 'gap-2',         // 8px
    md: 'gap-3',         // 12px
    lg: 'gap-4',         // 16px
    xl: 'gap-5',         // 20px
    xxl: 'gap-6',        // 24px
  },

  // Border radius
  radius: {
    sm: 'rounded-lg',    // 8px - buttons, inputs
    md: 'rounded-xl',    // 12px - cards
    lg: 'rounded-2xl',   // 16px - large containers
    full: 'rounded-full', // avatars, badges
  },

  // Typography - using Tailwind classes for consistency
  typography: {
    // Total amount display
    totalAmount: 'text-3xl font-bold text-foreground',

    // Section headers (uppercase labels)
    sectionLabel: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',

    // Staff name in groups
    staffName: 'text-base font-semibold text-foreground',

    // Staff subtitle (service count, total)
    staffSubtitle: 'text-sm text-muted-foreground',

    // Service name in rows
    serviceName: 'text-sm font-medium text-foreground',

    // Service details (duration, etc.)
    serviceDetail: 'text-xs text-muted-foreground',

    // Price display
    price: 'text-sm font-semibold text-foreground',
    priceLarge: 'text-base font-bold text-foreground',

    // Muted/secondary text
    muted: 'text-sm text-muted-foreground',

    // Hint text
    hint: 'text-xs text-muted-foreground',
  },

  // Colors for states
  colors: {
    // Active staff card styling
    staffActive: 'ring-2 ring-primary/30 bg-primary/5',
    staffActiveRing: 'ring-2 ring-primary/30',

    // Hover states
    serviceRowHover: 'hover:bg-muted/50',
    cardHover: 'hover:bg-muted/30 hover:border-primary/30',

    // Selected states
    serviceSelected: 'bg-primary/10 border-primary',

    // Status colors
    statusNotStarted: 'bg-gray-100 text-gray-700',
    statusInProgress: 'bg-orange-100 text-orange-700',
    statusPaused: 'bg-yellow-100 text-yellow-700',
    statusCompleted: 'bg-green-100 text-green-700',

    // Accent colors
    success: 'text-green-600',
    warning: 'text-orange-500',
    error: 'text-red-500',
    discount: 'text-green-600',
  },

  // Component dimensions
  dimensions: {
    // Avatar sizes
    avatarSm: 'w-10 h-10',    // 40px
    avatarMd: 'w-12 h-12',    // 48px
    avatarLg: 'w-14 h-14',    // 56px

    // Button heights
    buttonSm: 'h-8',          // 32px
    buttonMd: 'h-10',         // 40px
    buttonLg: 'h-12',         // 48px

    // Row heights
    serviceRowMin: 'min-h-14', // 56px

    // Client card
    clientCard: 'min-h-16',    // 64px
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    card: 'shadow-sm hover:shadow-md',
    elevate: 'shadow-md hover:shadow-lg',
  },

  // Transitions
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
  },

  // Border styles
  border: {
    default: 'border border-border',
    subtle: 'border border-border/50',
    primary: 'border-2 border-primary',
    divider: 'border-t border-border',
  },
} as const;

// Component-specific token sets for easy importing
export const ClientSectionStyles = {
  container: `${TicketPanelTokens.padding.xl} border-b border-border`,
  card: `bg-background ${TicketPanelTokens.radius.md} ${TicketPanelTokens.border.default} ${TicketPanelTokens.padding.lg} cursor-pointer ${TicketPanelTokens.colors.cardHover} ${TicketPanelTokens.transition.normal}`,
  avatar: `${TicketPanelTokens.dimensions.avatarMd} rounded-full bg-muted flex items-center justify-center`,
  title: TicketPanelTokens.typography.staffName,
  subtitle: TicketPanelTokens.typography.hint,
} as const;

export const StaffGroupStyles = {
  container: `bg-background ${TicketPanelTokens.radius.md} ${TicketPanelTokens.border.default} overflow-hidden`,
  containerActive: `bg-background ${TicketPanelTokens.radius.md} border-2 border-primary/30 overflow-hidden ${TicketPanelTokens.colors.staffActive}`,
  header: `${TicketPanelTokens.padding.lg} border-b border-border/50`,
  avatar: `${TicketPanelTokens.dimensions.avatarMd} rounded-full flex items-center justify-center`,
  name: TicketPanelTokens.typography.staffName,
  subtitle: TicketPanelTokens.typography.staffSubtitle,
  addServiceBtn: 'w-full py-2.5 text-primary hover:bg-primary/5 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
} as const;

export const ServiceRowStyles = {
  container: `${TicketPanelTokens.padding.lg} ${TicketPanelTokens.colors.serviceRowHover} flex items-center ${TicketPanelTokens.gap.md} ${TicketPanelTokens.transition.fast}`,
  checkbox: 'w-4 h-4 rounded border-border text-primary focus:ring-primary/20',
  content: 'flex-1 min-w-0',
  name: TicketPanelTokens.typography.serviceName,
  detail: TicketPanelTokens.typography.serviceDetail,
  price: TicketPanelTokens.typography.price,
  menuBtn: 'p-1.5 hover:bg-muted rounded',
} as const;

export const TotalsStyles = {
  container: 'border-t border-border bg-background p-5',
  row: 'flex justify-between text-sm',
  label: 'text-muted-foreground',
  value: 'text-foreground',
  totalRow: 'flex justify-between items-center py-3 border-t border-border',
  totalLabel: 'font-semibold text-foreground',
  totalValue: TicketPanelTokens.typography.totalAmount,
  primaryBtn: `w-full ${TicketPanelTokens.dimensions.buttonLg} bg-primary hover:bg-primary/90 text-primary-foreground ${TicketPanelTokens.radius.md} font-semibold ${TicketPanelTokens.transition.normal} flex items-center justify-center gap-2`,
  secondaryBtn: `flex-1 ${TicketPanelTokens.dimensions.buttonMd} border border-border ${TicketPanelTokens.radius.sm} text-foreground text-sm font-medium hover:bg-muted flex items-center justify-center gap-2`,
} as const;

// Empty state styles
export const EmptyStateStyles = {
  container: 'h-full flex flex-col items-center justify-center text-center p-6',
  iconWrapper: 'w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4',
  icon: 'text-primary text-2xl',
  title: 'font-semibold text-lg text-foreground mb-2',
  description: 'text-muted-foreground text-sm max-w-xs',
} as const;

export default TicketPanelTokens;
