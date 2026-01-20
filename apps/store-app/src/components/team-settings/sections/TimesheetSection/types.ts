import type { TimesheetEntry, BreakType, AttendanceAlertType } from '@/types/timesheet';

// ============================================
// DISPLAY ALERT TYPE
// ============================================

/**
 * Local interface for display alerts with severity (not stored, generated on-the-fly)
 */
export interface DisplayAlert {
  id: string;
  type: AttendanceAlertType | 'overtime';
  staffId: string;
  date: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

// ============================================
// MAIN COMPONENT PROPS
// ============================================

export interface TimesheetSectionProps {
  memberId: string;
  memberName: string;
  storeId: string;
}

// ============================================
// SUB-COMPONENT PROPS
// ============================================

export interface ClockButtonProps {
  isClockedIn: boolean;
  isLoading: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
}

export interface BreakButtonProps {
  isOnBreak: boolean;
  isLoading: boolean;
  disabled: boolean;
  onStartBreak: (type: BreakType) => void;
  onEndBreak: () => void;
}

export interface ShiftStatusCardProps {
  clockInTime: string | null;
  totalBreakMinutes: number;
  isOnBreak: boolean;
  currentBreakStart: string | null;
}

export interface RecentTimesheetsProps {
  timesheets: TimesheetEntry[];
  onViewDetails: (id: string) => void;
}

export interface AttendanceAlertsSectionProps {
  timesheets: TimesheetEntry[];
  memberName: string;
}

export interface TimesheetReportsSectionProps {
  timesheets: TimesheetEntry[];
  memberName: string;
}

export interface TimesheetDetailModalProps {
  timesheetId: string;
  timesheets: TimesheetEntry[];
  memberName: string;
  storeId: string;
  onClose: () => void;
}
