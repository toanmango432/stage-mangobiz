// ============================================
// ATTENDANCE THRESHOLDS
// ============================================

/** Minutes late before triggering an alert */
export const LATE_ARRIVAL_THRESHOLD_MINUTES = 15;

/** Minutes late before alert becomes high severity */
export const HIGH_SEVERITY_LATE_MINUTES = 30;

/** Minutes early departure before triggering an alert */
export const EARLY_DEPARTURE_THRESHOLD_MINUTES = 15;

/** Minutes early departure before alert becomes high severity */
export const HIGH_SEVERITY_EARLY_MINUTES = 30;

/** Overtime hours threshold for high severity alert */
export const HIGH_SEVERITY_OVERTIME_HOURS = 2;

// ============================================
// DISPLAY LIMITS
// ============================================

/** Maximum number of alerts to display */
export const MAX_ALERTS_DISPLAY = 10;

/** Maximum number of recent timesheets to display */
export const MAX_RECENT_TIMESHEETS_DISPLAY = 5;

// ============================================
// TIMER INTERVALS
// ============================================

/** Interval in milliseconds for updating the live timer */
export const TIMER_UPDATE_INTERVAL_MS = 1000;

// ============================================
// TAB CONFIGURATION
// ============================================

export const TIMESHEET_TABS = [
  { id: 'staff', label: 'Clock In/Out' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'reports', label: 'Reports' },
  { id: 'dashboard', label: 'Team Dashboard' },
] as const;

export type TimesheetTabId = (typeof TIMESHEET_TABS)[number]['id'];

// ============================================
// EXPORT CSV HEADERS
// ============================================

export const CSV_EXPORT_HEADERS = [
  'Date',
  'Clock In',
  'Clock Out',
  'Hours',
  'Overtime',
  'Breaks (min)',
  'Status',
] as const;

// ============================================
// STYLES
// ============================================

export const SEVERITY_STYLES = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-blue-50 border-blue-200 text-blue-800',
} as const;

export const CLOCK_BUTTON_STYLES = {
  base: `
    flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl
    font-semibold text-lg transition-all duration-300
  `,
  loading: 'opacity-50 cursor-not-allowed',
  clockedIn: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30',
  clockedOut: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30',
} as const;

export const BREAK_BUTTON_STYLES = {
  base: `
    flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl
    font-medium transition-all duration-300
  `,
  onBreak: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md',
  available: 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md',
  disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed',
} as const;
