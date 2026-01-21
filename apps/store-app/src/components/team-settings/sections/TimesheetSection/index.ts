// Main component
export { TimesheetSection } from './TimesheetSection';
export { default } from './TimesheetSection';

// Types
export type {
  DisplayAlert,
  TimesheetSectionProps,
  ClockButtonProps,
  BreakButtonProps,
  ShiftStatusCardProps,
  RecentTimesheetsProps,
  AttendanceAlertsSectionProps,
  TimesheetReportsSectionProps,
  TimesheetDetailModalProps,
} from './types';

// Constants
export {
  LATE_ARRIVAL_THRESHOLD_MINUTES,
  HIGH_SEVERITY_LATE_MINUTES,
  EARLY_DEPARTURE_THRESHOLD_MINUTES,
  HIGH_SEVERITY_EARLY_MINUTES,
  HIGH_SEVERITY_OVERTIME_HOURS,
  MAX_ALERTS_DISPLAY,
  MAX_RECENT_TIMESHEETS_DISPLAY,
  TIMER_UPDATE_INTERVAL_MS,
  TIMESHEET_TABS,
  CSV_EXPORT_HEADERS,
  SEVERITY_STYLES,
  CLOCK_BUTTON_STYLES,
  BREAK_BUTTON_STYLES,
} from './constants';
export type { TimesheetTabId } from './constants';

// Hooks
export { useTimesheetActions } from './hooks';
export type {
  UseTimesheetActionsParams,
  UseTimesheetActionsResult,
} from './hooks';
