/**
 * Shared visual tokens for Front Desk headers.
 * Update both ComingAppointments and WaitListSection together to keep parity.
 * Rollback note: remove consuming imports and delete this file to restore legacy styling.
 */
export const frontDeskHeaderBase =
  'flex-shrink-0 sticky top-0 z-30 backdrop-blur-md transition-all duration-200';

export const frontDeskHeaderSpacing = 'px-5 py-3.5';

export const frontDeskHeaderTitle = 'text-lg font-semibold tracking-tight';

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
}

export const comingHeaderTheme = {
  iconWrapper: 'h-7 w-7 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center',
  countPill: 'bg-sky-50/70 text-sky-600 text-[11px] font-medium px-1.5 py-0.5 rounded-md',
  metrics: {
    late: `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-red-200/30 bg-red-50/50 text-red-600`,
    next: `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-blue-200/30 bg-blue-50/50 text-blue-600`,
    later: `inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-slate-200/30 bg-slate-50/50 text-slate-500`,
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

export const waitingHeaderTheme = {
  iconWrapper: 'h-9 w-9 rounded-xl bg-violet-500 text-white flex items-center justify-center',
  countPill: 'bg-violet-100 text-violet-700',
  metrics: {
    vip: `${metricPillBase} border-amber-200/50 bg-amber-50 text-amber-700`,
    avg: `${metricPillBase} border-sky-200/50 bg-sky-50 text-sky-600`,
  },
  filterChip: 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200/60 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300/60 transition-all duration-200',
  filterChipActive:
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500 text-sm font-medium text-white',
};

export const headerContentSpacer = 'pt-0';

