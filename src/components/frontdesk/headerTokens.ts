/**
 * Shared visual tokens for Front Desk headers.
 * Update both ComingAppointments and WaitListSection together to keep parity.
 * Rollback note: remove consuming imports and delete this file to restore legacy styling.
 */
export const frontDeskHeaderBase =
  'flex-shrink-0 sticky top-0 z-30 backdrop-blur-md transition-all duration-200';

export const frontDeskHeaderSpacing = 'px-5 py-4';

export const frontDeskHeaderTitle = 'text-xl font-semibold tracking-tight';

export const frontDeskHeaderActionButton =
  'min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-all duration-200';

export const metricPillBase =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border';

export interface FrontDeskHeaderTheme {
  wrapper: string;
  padding?: string;
  iconWrapper: string;
  countBadge: string;
  metricPill?: string;
  titleClass?: string;
  subtitleClass?: string;
}

export const comingHeaderTheme = {
  iconWrapper: 'h-7 w-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center',
  countPill: 'bg-sky-50/70 text-sky-600 text-[11px] font-medium px-1.5 py-0.5 rounded-md',
  metrics: {
    late: `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium border border-red-200/30 bg-red-50/50 text-red-600`,
    next: `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium border border-blue-200/30 bg-blue-50/50 text-blue-600`,
    later: `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium border border-slate-200/30 bg-slate-50/50 text-slate-500`,
  },
};

export const primaryHeaderTheme: FrontDeskHeaderTheme = {
  wrapper: 'bg-white/70 border-b border-slate-200/60',
  iconWrapper: 'h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center',
  countBadge: 'bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg',
  metricPill: 'font-medium',
  titleClass: 'text-slate-900',
};

export const supportingHeaderTheme: FrontDeskHeaderTheme = {
  wrapper: 'bg-white/60 border-b border-slate-200/50',
  iconWrapper: 'h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center',
  countBadge: 'bg-slate-100 text-slate-600 text-[12px] font-medium px-2 py-0.5 rounded-lg',
  titleClass: 'text-[14px] font-medium text-slate-600',
  metricPill: 'text-[11px] font-medium',
};

export const waitingHeaderTheme: FrontDeskHeaderTheme = {
  wrapper: 'bg-white/70 border-b border-violet-100 backdrop-blur-md',
  iconWrapper: 'h-11 w-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center',
  countBadge: 'text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md',
  titleClass: 'text-xl font-semibold text-slate-900 leading-tight',
  subtitleClass: 'text-xs text-violet-600',
};

export const serviceHeaderTheme: FrontDeskHeaderTheme = {
  wrapper: 'bg-white/70 border-b border-green-100 backdrop-blur-md',
  iconWrapper: 'h-11 w-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center',
  countBadge: 'text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md',
  titleClass: 'text-xl font-semibold text-slate-900 leading-tight',
  subtitleClass: 'text-xs text-emerald-600',
};

export const pendingHeaderTheme: FrontDeskHeaderTheme = {
  wrapper: 'bg-white/70 border-b border-amber-100 backdrop-blur-md',
  iconWrapper: 'h-11 w-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center',
  countBadge: 'text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md',
  titleClass: 'text-xl font-semibold text-slate-900 leading-tight',
  subtitleClass: 'text-xs text-amber-600',
};

export const headerContentSpacer = 'pt-0';

// Semantic size tokens for consistent icon sizing
export const headerIconSizes = {
  primary: 'h-11 w-11',    // Main section headers (Service, Waiting, etc.)
  supporting: 'h-8 w-8',   // Secondary/supporting headers
  compact: 'h-7 w-7',      // Compact headers (Coming Appointments)
};

// WCAG 2.2 compliant touch target minimum
export const minTouchTarget = 'min-h-[44px] min-w-[44px]';

// ============================================================================
// SECTION HEADER STYLES
// Used by FrontDesk.tsx headerStyles prop - replaces hardcoded hex values
// Uses Tailwind config colors: waitList, service, comingAppointments, pendingTickets, closedTickets
// ============================================================================

export interface SectionHeaderStyles {
  bg: string;
  accentColor: string;
  iconColor: string;
  activeIconColor: string;
  titleColor: string;
  borderColor: string;
  counterBg: string;
  counterText: string;
}

export const sectionHeaderStyles: Record<string, SectionHeaderStyles> = {
  waitList: {
    bg: 'bg-gray-50',
    accentColor: 'waitList-500',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-waitList-500',
    titleColor: 'text-gray-900',
    borderColor: 'border-waitList-100',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
  service: {
    bg: 'bg-gray-50',
    accentColor: 'service-500',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-service-500',
    titleColor: 'text-gray-900',
    borderColor: 'border-service-100',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
  comingAppointments: {
    bg: 'bg-gray-50',
    accentColor: 'comingAppointments-500',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-comingAppointments-500',
    titleColor: 'text-gray-900',
    borderColor: 'border-comingAppointments-100',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
  pending: {
    bg: 'bg-gray-50',
    accentColor: 'pendingTickets-500',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-pendingTickets-500',
    titleColor: 'text-gray-900',
    borderColor: 'border-pendingTickets-100',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
  closed: {
    bg: 'bg-gray-50',
    accentColor: 'closedTickets-400',
    iconColor: 'text-gray-400',
    activeIconColor: 'text-closedTickets-400',
    titleColor: 'text-gray-900',
    borderColor: 'border-closedTickets-200',
    counterBg: 'bg-gray-100',
    counterText: 'text-gray-600',
  },
} as const;

// ============================================================================
// SUBORDINATE TAB STYLES
// Layout: Icon centered vertically | Title/Metric stacked | Count on right
// Each tab has subtle background to indicate clickability
// ============================================================================

export const subordinateTabTheme = {
  container: 'bg-white border-b border-gray-200',
  tabWrapper: 'flex items-stretch gap-3 px-4 py-2',
  tab: {
    // Card-style tab with subtle background
    base: 'relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer',
    active: 'bg-gray-50',
    inactive: 'bg-gray-50/50 hover:bg-gray-100/60',
  },
  // Bottom indicator line
  indicator: {
    base: 'absolute bottom-0 left-3 right-3 h-[2px] rounded-full',
    service: 'bg-service-500',
    waitList: 'bg-waitList-500',
    comingAppointments: 'bg-comingAppointments-500',
  },
  // Icon - centered vertically (self-center when in flex row)
  icon: {
    base: 'flex-shrink-0',
    service: { active: 'text-service-500', inactive: 'text-gray-400' },
    waitList: { active: 'text-waitList-500', inactive: 'text-gray-400' },
    comingAppointments: { active: 'text-comingAppointments-500', inactive: 'text-gray-400' },
  },
  // Center column: Title on top, Metric below
  centerColumn: 'flex flex-col gap-0',
  title: {
    base: 'text-[13px] font-medium leading-tight',
    service: { active: 'text-gray-900', inactive: 'text-gray-500' },
    waitList: { active: 'text-gray-900', inactive: 'text-gray-500' },
    comingAppointments: { active: 'text-gray-900', inactive: 'text-gray-500' },
  },
  metric: {
    base: 'text-[11px] font-medium leading-tight',
    service: { active: 'text-service-500', inactive: 'text-gray-400' },
    waitList: { active: 'text-waitList-500', inactive: 'text-gray-400' },
    comingAppointments: { active: 'text-comingAppointments-500', inactive: 'text-gray-400' },
  },
  // Right: Count - moderate size
  count: {
    base: 'text-lg font-semibold tabular-nums ml-2',
    service: { active: 'text-service-600', inactive: 'text-gray-400' },
    waitList: { active: 'text-waitList-600', inactive: 'text-gray-400' },
    comingAppointments: { active: 'text-comingAppointments-600', inactive: 'text-gray-400' },
  },
} as const;

