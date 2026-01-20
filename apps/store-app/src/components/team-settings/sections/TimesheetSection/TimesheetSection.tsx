import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, Coffee, Play, CheckCircle, AlertCircle, Calendar, Timer, Users, AlertTriangle, Download, FileText, BarChart3 } from 'lucide-react';
import { Card, SectionHeader, Button, Badge, Modal, Textarea, Tabs } from '../../components/SharedComponents';
import type { AppDispatch, RootState } from '@/store';
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  fetchTimesheetsByStaff,
  fetchStaffShiftStatus,
  selectStaffShiftStatus,
  selectTimesheetsByStaff,
  approveTimesheet,
  disputeTimesheet,
  selectTimesheetLoading,
} from '@/store/slices/timesheetSlice';
import { selectAllTeamMembers } from '@/store/slices/teamSlice';
import type { TimesheetEntry, BreakType } from '@/types/timesheet';
import { formatHours } from '@/utils/overtimeCalculation';
import { TimesheetDashboard } from '../../components/TimesheetDashboard';
// Types and constants
import type {
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
import {
  LATE_ARRIVAL_THRESHOLD_MINUTES,
  HIGH_SEVERITY_LATE_MINUTES,
  EARLY_DEPARTURE_THRESHOLD_MINUTES,
  HIGH_SEVERITY_EARLY_MINUTES,
  HIGH_SEVERITY_OVERTIME_HOURS,
  MAX_ALERTS_DISPLAY,
  MAX_RECENT_TIMESHEETS_DISPLAY,
  TIMER_UPDATE_INTERVAL_MS,
  SEVERITY_STYLES,
  CSV_EXPORT_HEADERS,
} from './constants';

// ============================================
// CLOCK IN/OUT BUTTON COMPONENT
// ============================================

const ClockButton: React.FC<ClockButtonProps> = ({
  isClockedIn,
  isLoading,
  onClockIn,
  onClockOut,
}) => {
  return (
    <button
      onClick={isClockedIn ? onClockOut : onClockIn}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl
        font-semibold text-lg transition-all duration-300
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isClockedIn
          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30'
          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30'
        }
      `}
    >
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <Clock className="w-6 h-6" />
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </>
      )}
    </button>
  );
};

// ============================================
// BREAK BUTTON COMPONENT
// ============================================

const BreakButton: React.FC<BreakButtonProps> = ({
  isOnBreak,
  isLoading,
  disabled,
  onStartBreak,
  onEndBreak,
}) => {
  const [showBreakOptions, setShowBreakOptions] = useState(false);

  if (isOnBreak) {
    return (
      <button
        onClick={onEndBreak}
        disabled={isLoading}
        className={`
          flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl
          font-medium transition-all duration-300
          bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700
          text-white shadow-md
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Play className="w-5 h-5" />
            End Break
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowBreakOptions(!showBreakOptions)}
        disabled={disabled || isLoading}
        className={`
          flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl
          font-medium transition-all duration-300
          ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md'
          }
        `}
      >
        <Coffee className="w-5 h-5" />
        Take Break
      </button>

      {showBreakOptions && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
          <button
            onClick={() => {
              onStartBreak('paid');
              setShowBreakOptions(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Paid Break</span>
          </button>
          <button
            onClick={() => {
              onStartBreak('unpaid');
              setShowBreakOptions(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-medium">Unpaid Break</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// SHIFT STATUS CARD
// ============================================

const ShiftStatusCard: React.FC<ShiftStatusCardProps> = ({
  clockInTime,
  totalBreakMinutes,
  isOnBreak,
  currentBreakStart,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, TIMER_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Calculate live worked time
  const getLiveWorkedTime = useCallback(() => {
    if (!clockInTime) return 0;
    const clockIn = new Date(clockInTime).getTime();
    const now = currentTime.getTime();
    let worked = Math.floor((now - clockIn) / (1000 * 60)); // in minutes

    // Subtract breaks
    worked -= totalBreakMinutes;

    // If on break, also subtract current break duration
    if (isOnBreak && currentBreakStart) {
      const breakStart = new Date(currentBreakStart).getTime();
      worked -= Math.floor((now - breakStart) / (1000 * 60));
    }

    return Math.max(0, worked);
  }, [clockInTime, currentTime, totalBreakMinutes, isOnBreak, currentBreakStart]);

  // Calculate current break duration
  const getCurrentBreakDuration = useCallback(() => {
    if (!isOnBreak || !currentBreakStart) return 0;
    const breakStart = new Date(currentBreakStart).getTime();
    const now = currentTime.getTime();
    return Math.floor((now - breakStart) / (1000 * 60));
  }, [isOnBreak, currentBreakStart, currentTime]);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  };

  const formatClockTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!clockInTime) {
    return (
      <Card className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Not clocked in</p>
        <p className="text-sm text-gray-400 mt-1">Clock in to start tracking time</p>
      </Card>
    );
  }

  const liveWorked = getLiveWorkedTime();
  const currentBreakDuration = getCurrentBreakDuration();

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-600">Clocked In</span>
        </div>
        <span className="text-sm text-gray-500">
          Started at {formatClockTime(clockInTime)}
        </span>
      </div>

      {/* Main Timer */}
      <div className="text-center py-4">
        <div className="text-4xl font-bold text-gray-800 font-mono">
          {formatTime(liveWorked)}
        </div>
        <p className="text-sm text-gray-500 mt-1">Time Worked</p>
      </div>

      {/* Break Status */}
      {isOnBreak && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Coffee className="w-4 h-4" />
            <span className="font-medium">On Break</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {formatTime(currentBreakDuration)}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">
            {formatTime(totalBreakMinutes + currentBreakDuration)}
          </div>
          <p className="text-xs text-gray-500">Total Breaks</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">
            {formatTime(liveWorked + totalBreakMinutes + currentBreakDuration)}
          </div>
          <p className="text-xs text-gray-500">Total Shift</p>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// RECENT TIMESHEETS LIST
// ============================================

const RecentTimesheets: React.FC<RecentTimesheetsProps> = ({ timesheets, onViewDetails }) => {
  const getStatusBadge = (status: TimesheetEntry['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'disputed':
        return (
          <Badge variant="error" size="sm">
            <AlertCircle className="w-3 h-3 mr-1" />
            Disputed
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTimeRange = (entry: TimesheetEntry) => {
    if (!entry.actualClockIn) return 'Not clocked in';
    const clockIn = new Date(entry.actualClockIn).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    if (!entry.actualClockOut) return `${clockIn} - In Progress`;
    const clockOut = new Date(entry.actualClockOut).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${clockIn} - ${clockOut}`;
  };

  if (timesheets.length === 0) {
    return (
      <Card className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No recent timesheets</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {timesheets.slice(0, MAX_RECENT_TIMESHEETS_DISPLAY).map((entry) => (
        <Card
          key={entry.id}
          hover
          onClick={() => onViewDetails(entry.id)}
          className="flex items-center justify-between"
        >
          <div>
            <div className="font-medium text-gray-800">{formatDate(entry.date)}</div>
            <div className="text-sm text-gray-500">{formatTimeRange(entry)}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-semibold text-gray-800">
                {formatHours(entry.hours.actualHours)}
              </div>
              <div className="text-xs text-gray-500">worked</div>
            </div>
            {getStatusBadge(entry.status)}
          </div>
        </Card>
      ))}
    </div>
  );
};

// ============================================
// ATTENDANCE ALERTS SECTION
// ============================================

const AttendanceAlertsSection: React.FC<AttendanceAlertsSectionProps> = ({
  timesheets,
  memberName,
}) => {
  // Generate display alerts based on timesheet data
  const alerts = useMemo((): DisplayAlert[] => {
    const generatedAlerts: DisplayAlert[] = [];

    timesheets.forEach((ts) => {
      // Check for late arrival
      if (ts.scheduledStart && ts.actualClockIn) {
        const scheduled = new Date(ts.scheduledStart).getTime();
        const actual = new Date(ts.actualClockIn).getTime();
        const diffMinutes = (actual - scheduled) / (1000 * 60);

        if (diffMinutes > LATE_ARRIVAL_THRESHOLD_MINUTES) {
          generatedAlerts.push({
            id: `late-${ts.id}`,
            type: 'late_arrival',
            staffId: ts.staffId,
            date: ts.date,
            message: `Late arrival: ${Math.round(diffMinutes)} minutes after scheduled start`,
            severity: diffMinutes > HIGH_SEVERITY_LATE_MINUTES ? 'high' : 'medium',
            timestamp: ts.actualClockIn,
          });
        }
      }

      // Check for early departure
      if (ts.scheduledEnd && ts.actualClockOut) {
        const scheduled = new Date(ts.scheduledEnd).getTime();
        const actual = new Date(ts.actualClockOut).getTime();
        const diffMinutes = (scheduled - actual) / (1000 * 60);

        if (diffMinutes > EARLY_DEPARTURE_THRESHOLD_MINUTES) {
          generatedAlerts.push({
            id: `early-${ts.id}`,
            type: 'early_departure',
            staffId: ts.staffId,
            date: ts.date,
            message: `Early departure: ${Math.round(diffMinutes)} minutes before scheduled end`,
            severity: diffMinutes > HIGH_SEVERITY_EARLY_MINUTES ? 'high' : 'medium',
            timestamp: ts.actualClockOut,
          });
        }
      }

      // Check for overtime
      if (ts.hours.overtimeHours > 0) {
        generatedAlerts.push({
          id: `ot-${ts.id}`,
          type: 'overtime',
          staffId: ts.staffId,
          date: ts.date,
          message: `Overtime: ${formatHours(ts.hours.overtimeHours)} hours of overtime recorded`,
          severity: ts.hours.overtimeHours > HIGH_SEVERITY_OVERTIME_HOURS ? 'high' : 'low',
          timestamp: ts.updatedAt,
        });
      }
    });

    return generatedAlerts.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, MAX_ALERTS_DISPLAY);
  }, [timesheets]);

  const getSeverityStyles = (severity: DisplayAlert['severity']) => {
    return SEVERITY_STYLES[severity] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getAlertIcon = (type: DisplayAlert['type']) => {
    switch (type) {
      case 'late_arrival':
        return <Clock className="w-4 h-4" />;
      case 'early_departure':
        return <AlertTriangle className="w-4 h-4" />;
      case 'overtime':
        return <Timer className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
        <p className="text-gray-500">No attendance alerts</p>
        <p className="text-sm text-gray-400 mt-1">{memberName} has perfect attendance!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-3 rounded-lg border flex items-start gap-3 ${getSeverityStyles(alert.severity)}`}
        >
          <div className="mt-0.5">
            {getAlertIcon(alert.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{alert.message}</p>
            <p className="text-xs opacity-75 mt-0.5">
              {new Date(alert.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <Badge
            variant={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
            size="sm"
          >
            {alert.severity}
          </Badge>
        </div>
      ))}
    </div>
  );
};

// ============================================
// TIMESHEET REPORTS SECTION
// ============================================

const TimesheetReportsSection: React.FC<TimesheetReportsSectionProps> = ({
  timesheets,
  memberName,
}) => {
  // Calculate summary statistics
  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Filter for this month's timesheets
    const monthTimesheets = timesheets.filter((ts) => {
      const d = new Date(ts.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    // Calculate totals
    const totalHours = monthTimesheets.reduce((sum, ts) => sum + ts.hours.actualHours, 0);
    const totalOvertimeHours = monthTimesheets.reduce((sum, ts) => sum + ts.hours.overtimeHours, 0);
    const totalBreakMinutes = monthTimesheets.reduce((sum, ts) => sum + ts.hours.breakMinutes, 0);
    const pendingCount = monthTimesheets.filter((ts) => ts.status === 'pending').length;
    const approvedCount = monthTimesheets.filter((ts) => ts.status === 'approved').length;
    const disputedCount = monthTimesheets.filter((ts) => ts.status === 'disputed').length;
    const daysWorked = monthTimesheets.length;
    const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

    return {
      totalHours,
      totalOvertimeHours,
      totalBreakMinutes,
      pendingCount,
      approvedCount,
      disputedCount,
      daysWorked,
      avgHoursPerDay,
    };
  }, [timesheets]);

  const handleExportCSV = () => {
    // Generate CSV data
    const rows = timesheets.map((ts) => [
      ts.date,
      ts.actualClockIn ? new Date(ts.actualClockIn).toLocaleTimeString() : '-',
      ts.actualClockOut ? new Date(ts.actualClockOut).toLocaleTimeString() : '-',
      ts.hours.actualHours.toFixed(2),
      ts.hours.overtimeHours.toFixed(2),
      ts.hours.breakMinutes.toString(),
      ts.status,
    ]);

    const csvContent = [
      CSV_EXPORT_HEADERS.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `timesheet-${memberName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Monthly Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700">This Month's Summary</h4>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <BarChart3 className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{formatHours(summary.totalHours)}</p>
            <p className="text-xs text-gray-500">Total Hours</p>
          </Card>
          <Card className="text-center">
            <Timer className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{formatHours(summary.totalOvertimeHours)}</p>
            <p className="text-xs text-gray-500">Overtime</p>
          </Card>
          <Card className="text-center">
            <Calendar className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{summary.daysWorked}</p>
            <p className="text-xs text-gray-500">Days Worked</p>
          </Card>
          <Card className="text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{formatHours(summary.avgHoursPerDay)}</p>
            <p className="text-xs text-gray-500">Avg Hours/Day</p>
          </Card>
        </div>
      </div>

      {/* Approval Status */}
      <Card>
        <h4 className="font-medium text-gray-800 mb-4">Approval Status</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="flex h-full">
              <div
                className="bg-emerald-500"
                style={{ width: `${(summary.approvedCount / Math.max(summary.approvedCount + summary.pendingCount + summary.disputedCount, 1)) * 100}%` }}
              />
              <div
                className="bg-amber-500"
                style={{ width: `${(summary.pendingCount / Math.max(summary.approvedCount + summary.pendingCount + summary.disputedCount, 1)) * 100}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${(summary.disputedCount / Math.max(summary.approvedCount + summary.pendingCount + summary.disputedCount, 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-gray-600">Approved: {summary.approvedCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-gray-600">Pending: {summary.pendingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">Disputed: {summary.disputedCount}</span>
          </div>
        </div>
      </Card>

      {/* Break Time Summary */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-800">Break Time</h4>
            <p className="text-sm text-gray-500">Total break time this month</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">
              {Math.floor(summary.totalBreakMinutes / 60)}h {summary.totalBreakMinutes % 60}m
            </p>
            <p className="text-xs text-gray-500">
              ~{Math.round(summary.totalBreakMinutes / Math.max(summary.daysWorked, 1))} min/day
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================
// MAIN TIMESHEET SECTION COMPONENT
// ============================================

export const TimesheetSection: React.FC<TimesheetSectionProps> = ({
  memberId,
  memberName,
  storeId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('staff');

  // Get shift status from Redux
  const shiftStatus = useSelector((state: RootState) =>
    selectStaffShiftStatus(state, memberId)
  );

  // Get recent timesheets
  const timesheets = useSelector((state: RootState) =>
    selectTimesheetsByStaff(state, memberId)
  );

  // Get all team members for dashboard
  const allMembers = useSelector(selectAllTeamMembers);
  const staffMembers = useMemo(() =>
    allMembers.map(m => ({ id: m.id, name: m.profile.displayName })),
    [allMembers]
  );

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchStaffShiftStatus({ storeId, staffId: memberId }));
    dispatch(fetchTimesheetsByStaff({ storeId, staffId: memberId }));
  }, [dispatch, storeId, memberId]);

  // Sort timesheets by date (most recent first)
  const sortedTimesheets = [...timesheets].sort((a, b) => b.date.localeCompare(a.date));

  // Handlers
  const handleClockIn = async () => {
    console.log('[TimesheetSection] Clock In clicked:', { memberId, storeId });
    setIsLoading(true);
    try {
      const result = await dispatch(clockIn({
        params: { staffId: memberId },
        context: { userId: memberId, deviceId: 'web', storeId },
      })).unwrap();
      console.log('[TimesheetSection] Clock In succeeded:', result);
    } catch (error) {
      console.error('[TimesheetSection] Clock In FAILED:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      await dispatch(clockOut({
        params: { staffId: memberId },
        context: { userId: memberId, deviceId: 'web', storeId },
      })).unwrap();
    } catch (error) {
      console.error('Failed to clock out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartBreak = async (breakType: BreakType) => {
    setIsLoading(true);
    try {
      await dispatch(startBreak({
        params: { staffId: memberId, breakType },
        context: { userId: memberId, deviceId: 'web', storeId },
      })).unwrap();
    } catch (error) {
      console.error('Failed to start break:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setIsLoading(true);
    try {
      await dispatch(endBreak({
        params: { staffId: memberId },
        context: { userId: memberId, deviceId: 'web', storeId },
      })).unwrap();
    } catch (error) {
      console.error('Failed to end break:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isClockedIn = shiftStatus?.isClockedIn ?? false;
  const isOnBreak = shiftStatus?.isOnBreak ?? false;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Time & Attendance"
        subtitle={`Manage clock in/out, timesheets, and attendance for ${memberName}`}
        icon={<Timer className="w-5 h-5" />}
      />

      {/* Tabs for different views */}
      <Tabs
        tabs={[
          { id: 'staff', label: 'Clock In/Out', icon: <Clock className="w-4 h-4" /> },
          { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" /> },
          { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
          { id: 'dashboard', label: 'Team Dashboard', icon: <Users className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Staff Clock In/Out Tab */}
      {activeTab === 'staff' && (
        <>
          {/* Clock In/Out Actions */}
          <Card>
            <div className="space-y-4">
              <ClockButton
                isClockedIn={isClockedIn}
                isLoading={isLoading}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
              />

              <BreakButton
                isOnBreak={isOnBreak}
                isLoading={isLoading}
                disabled={!isClockedIn}
                onStartBreak={handleStartBreak}
                onEndBreak={handleEndBreak}
              />
            </div>
          </Card>

          {/* Current Shift Status */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Current Shift</h4>
            <ShiftStatusCard
              clockInTime={shiftStatus?.clockInTime ?? null}
              totalBreakMinutes={shiftStatus?.totalBreakMinutes ?? 0}
              isOnBreak={isOnBreak}
              currentBreakStart={shiftStatus?.currentBreakStart ?? null}
            />
          </div>

          {/* Recent Timesheets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Recent Timesheets</h4>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('reports')}>
                View All
              </Button>
            </div>
            <RecentTimesheets
              timesheets={sortedTimesheets}
              onViewDetails={(id) => setSelectedTimesheetId(id)}
            />
          </div>
        </>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Attendance Alerts</h4>
          <AttendanceAlertsSection
            timesheets={sortedTimesheets}
            memberName={memberName}
          />
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <TimesheetReportsSection
          timesheets={sortedTimesheets}
          memberName={memberName}
        />
      )}

      {/* Team Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <TimesheetDashboard
          storeId={storeId}
          staffMembers={staffMembers}
        />
      )}

      {/* Timesheet Details Modal */}
      {selectedTimesheetId && (
        <TimesheetDetailModal
          timesheetId={selectedTimesheetId}
          timesheets={sortedTimesheets}
          memberName={memberName}
          storeId={storeId}
          onClose={() => setSelectedTimesheetId(null)}
        />
      )}
    </div>
  );
};

// ============================================
// TIMESHEET DETAIL MODAL
// ============================================

const TimesheetDetailModal: React.FC<TimesheetDetailModalProps> = ({
  timesheetId,
  timesheets,
  memberName,
  storeId,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectTimesheetLoading);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const timesheet = timesheets.find((ts) => ts.id === timesheetId);

  if (!timesheet) {
    return null;
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleApprove = async () => {
    await dispatch(
      approveTimesheet({
        timesheetId: timesheet.id,
        context: { userId: 'manager', deviceId: 'web', storeId },
      })
    ).unwrap();
    onClose();
  };

  const handleDispute = async () => {
    if (disputeReason.trim()) {
      await dispatch(
        disputeTimesheet({
          timesheetId: timesheet.id,
          reason: disputeReason,
          context: { userId: 'manager', deviceId: 'web', storeId },
        })
      ).unwrap();
      onClose();
    }
  };

  const getStatusBadge = () => {
    switch (timesheet.status) {
      case 'approved':
        return (
          <Badge variant="success" size="md">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
          </Badge>
        );
      case 'disputed':
        return (
          <Badge variant="error" size="md">
            <AlertCircle className="w-4 h-4 mr-1" />
            Disputed
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" size="md">
            <Clock className="w-4 h-4 mr-1" />
            Pending Approval
          </Badge>
        );
    }
  };

  return (
    <Modal title={`Timesheet - ${memberName}`} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-gray-500">{formatDate(timesheet.date)}</p>
          {getStatusBadge()}
        </div>

        {/* Time Details */}
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Scheduled</p>
              <p className="font-medium">
                {formatTime(timesheet.scheduledStart)} - {formatTime(timesheet.scheduledEnd)}
              </p>
              <p className="text-sm text-gray-400">
                {formatHours(timesheet.hours.scheduledHours)} hours
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Actual</p>
              <p className="font-medium">
                {formatTime(timesheet.actualClockIn)} - {formatTime(timesheet.actualClockOut)}
              </p>
              <p className="text-sm text-gray-400">
                {formatHours(timesheet.hours.actualHours)} hours
              </p>
            </div>
          </div>
        </Card>

        {/* Hours Breakdown */}
        <Card>
          <h4 className="font-medium text-gray-800 mb-3">Hours Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Regular Hours</span>
              <span className="font-medium">{formatHours(timesheet.hours.regularHours)}</span>
            </div>
            {timesheet.hours.overtimeHours > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Overtime Hours</span>
                <span className="font-medium text-purple-600">
                  {formatHours(timesheet.hours.overtimeHours)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Break Time</span>
              <span className="font-medium">{timesheet.hours.breakMinutes} min</span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800">Total Hours</span>
                <span className="font-bold text-gray-800">
                  {formatHours(timesheet.hours.actualHours)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Breaks Detail */}
        {timesheet.breaks.length > 0 && (
          <Card>
            <h4 className="font-medium text-gray-800 mb-3">Breaks</h4>
            <div className="space-y-2">
              {timesheet.breaks.map((breakEntry, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        breakEntry.type === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-gray-600">
                      {formatTime(breakEntry.startTime)} - {formatTime(breakEntry.endTime)}
                    </span>
                    <Badge variant={breakEntry.type === 'paid' ? 'success' : 'warning'} size="sm">
                      {breakEntry.type}
                    </Badge>
                  </div>
                  <span className="text-gray-500">{breakEntry.duration} min</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Dispute Reason (if disputed) */}
        {timesheet.status === 'disputed' && timesheet.disputeReason && (
          <Card className="bg-red-50 border-red-200">
            <h4 className="font-medium text-red-800 mb-2">Dispute Reason</h4>
            <p className="text-sm text-red-700">{timesheet.disputeReason}</p>
          </Card>
        )}

        {/* Dispute Form */}
        {showDisputeForm && timesheet.status === 'pending' && (
          <Card>
            <Textarea
              label="Dispute Reason"
              value={disputeReason}
              onChange={setDisputeReason}
              placeholder="Enter the reason for disputing this timesheet..."
              rows={3}
              required
            />
          </Card>
        )}

        {/* Actions */}
        {timesheet.status === 'pending' && (
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            {!showDisputeForm ? (
              <>
                <Button variant="primary" onClick={handleApprove} loading={isLoading} fullWidth>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisputeForm(true)}
                  fullWidth
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Dispute
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="danger"
                  onClick={handleDispute}
                  loading={isLoading}
                  disabled={!disputeReason.trim()}
                  fullWidth
                >
                  Submit Dispute
                </Button>
                <Button variant="ghost" onClick={() => setShowDisputeForm(false)} fullWidth>
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TimesheetSection;
