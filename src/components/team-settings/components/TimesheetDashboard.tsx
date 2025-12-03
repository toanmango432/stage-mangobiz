import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Download,
  Users,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  SectionHeader,
  Button,
  Badge,
  Modal,
  Select,
  Checkbox,
  Tabs,
  Textarea,
} from './SharedComponents';
import type { AppDispatch } from '../../../store';
import {
  fetchTimesheetsByDateRange,
  approveTimesheet,
  disputeTimesheet,
  bulkApproveTimesheets,
  selectAllTimesheets,
  selectTimesheetLoading,
} from '../../../store/slices/timesheetSlice';
import type { TimesheetEntry, TimesheetStatus } from '../../../types/timesheet';
import { formatHours } from '../../../utils/overtimeCalculation';

// ============================================
// TYPES
// ============================================

interface TimesheetDashboardProps {
  storeId: string;
  staffMembers: Array<{
    id: string;
    name: string;
  }>;
}

interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getWeekDays = (weekStartDate: Date): WeekDay[] => {
  const days: WeekDay[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    days.push({
      date: dateStr,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: dateStr === today,
    });
  }

  return days;
};

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Sunday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatWeekRange = (startDate: Date): string => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
  }
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`;
};

// ============================================
// TIMESHEET ROW COMPONENT
// ============================================

interface TimesheetRowProps {
  staffId: string;
  staffName: string;
  weekDays: WeekDay[];
  timesheets: TimesheetEntry[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onViewDetails: (timesheet: TimesheetEntry) => void;
}

const TimesheetRow: React.FC<TimesheetRowProps> = ({
  staffName,
  weekDays,
  timesheets,
  isSelected,
  onToggleSelect,
  onViewDetails,
}) => {
  // Get timesheet for each day
  const getTimesheetForDate = (date: string) => {
    return timesheets.find((ts) => ts.date === date);
  };

  // Calculate weekly totals
  const weeklyTotals = useMemo(() => {
    let scheduled = 0;
    let actual = 0;
    let overtime = 0;
    let variance = 0;
    let pendingCount = 0;
    let hasVariance = false;

    timesheets.forEach((ts) => {
      scheduled += ts.hours.scheduledHours;
      actual += ts.hours.actualHours;
      overtime += ts.hours.overtimeHours;
      if (ts.status === 'pending') pendingCount++;
    });

    variance = actual - scheduled;
    hasVariance = Math.abs(variance) > 0.25; // 15 min threshold

    return { scheduled, actual, overtime, variance, pendingCount, hasVariance };
  }, [timesheets]);

  // Render cell for a day
  const renderDayCell = (day: WeekDay) => {
    const timesheet = getTimesheetForDate(day.date);

    if (!timesheet) {
      return (
        <td key={day.date} className="px-2 py-3 text-center">
          <span className="text-gray-300">OFF</span>
        </td>
      );
    }

    const hasVariance =
      Math.abs(timesheet.hours.actualHours - timesheet.hours.scheduledHours) > 0.25;
    const isDisputed = timesheet.status === 'disputed';
    const isPending = timesheet.status === 'pending';

    return (
      <td
        key={day.date}
        className={`px-2 py-3 text-center cursor-pointer hover:bg-gray-50 transition-colors
          ${isDisputed ? 'bg-red-50' : ''}
          ${hasVariance && !isDisputed ? 'bg-amber-50' : ''}
        `}
        onClick={() => onViewDetails(timesheet)}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={`font-semibold ${
              isDisputed
                ? 'text-red-600'
                : hasVariance
                ? 'text-amber-600'
                : 'text-gray-800'
            }`}
          >
            {formatHours(timesheet.hours.actualHours)}
          </span>
          {hasVariance && (
            <span className="text-xs text-gray-400">
              ({timesheet.hours.scheduledHours > 0 ? formatHours(timesheet.hours.scheduledHours) : '-'})
            </span>
          )}
          {(isPending || isDisputed) && (
            <span className="mt-1">
              {isDisputed ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              )}
            </span>
          )}
        </div>
      </td>
    );
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Checkbox checked={isSelected} onChange={onToggleSelect} />
          <span className="font-medium text-gray-800">{staffName}</span>
          {weeklyTotals.pendingCount > 0 && (
            <Badge variant="warning" size="sm">
              {weeklyTotals.pendingCount} pending
            </Badge>
          )}
        </div>
      </td>
      {weekDays.map((day) => renderDayCell(day))}
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end">
          <span className="font-bold text-gray-800">
            {formatHours(weeklyTotals.actual)}
          </span>
          {weeklyTotals.hasVariance && (
            <span
              className={`text-xs ${
                weeklyTotals.variance > 0 ? 'text-amber-600' : 'text-red-600'
              }`}
            >
              {weeklyTotals.variance > 0 ? '+' : ''}
              {formatHours(weeklyTotals.variance)} vs scheduled
            </span>
          )}
          {weeklyTotals.overtime > 0 && (
            <span className="text-xs text-purple-600">
              {formatHours(weeklyTotals.overtime)} OT
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

// ============================================
// TIMESHEET DETAIL MODAL
// ============================================

interface TimesheetDetailModalProps {
  timesheet: TimesheetEntry;
  staffName: string;
  onClose: () => void;
  onApprove: () => void;
  onDispute: (reason: string) => void;
  isLoading: boolean;
}

const TimesheetDetailModal: React.FC<TimesheetDetailModalProps> = ({
  timesheet,
  staffName,
  onClose,
  onApprove,
  onDispute,
  isLoading,
}) => {
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);

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

  const handleDispute = () => {
    if (disputeReason.trim()) {
      onDispute(disputeReason);
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
    <Modal title={`Timesheet - ${staffName}`} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">{formatDate(timesheet.date)}</p>
          </div>
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
                <Button variant="primary" onClick={onApprove} loading={isLoading} fullWidth>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisputeForm(true)}
                  fullWidth
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
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

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export const TimesheetDashboard: React.FC<TimesheetDashboardProps> = ({
  storeId,
  staffMembers,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const allTimesheets = useSelector(selectAllTimesheets);
  const isLoading = useSelector(selectTimesheetLoading);

  // State
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<TimesheetStatus | 'all'>('all');
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetEntry | null>(null);
  const [activeTab, setActiveTab] = useState('week');

  // Get week days
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Fetch timesheets for the week
  useEffect(() => {
    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;
    dispatch(fetchTimesheetsByDateRange({ storeId, startDate, endDate }));
  }, [dispatch, storeId, weekDays]);

  // Filter timesheets by week
  const weekTimesheets = useMemo(() => {
    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;
    return allTimesheets.filter(
      (ts) => ts.date >= startDate && ts.date <= endDate && ts.storeId === storeId
    );
  }, [allTimesheets, weekDays, storeId]);

  // Group timesheets by staff
  const timesheetsByStaff = useMemo(() => {
    const grouped: Record<string, TimesheetEntry[]> = {};
    staffMembers.forEach((staff) => {
      grouped[staff.id] = weekTimesheets.filter((ts) => ts.staffId === staff.id);
    });
    return grouped;
  }, [weekTimesheets, staffMembers]);

  // Calculate totals
  const weeklyTotals = useMemo(() => {
    let totalHours = 0;
    let totalOvertime = 0;
    let pendingCount = 0;
    let disputedCount = 0;

    weekTimesheets.forEach((ts) => {
      totalHours += ts.hours.actualHours;
      totalOvertime += ts.hours.overtimeHours;
      if (ts.status === 'pending') pendingCount++;
      if (ts.status === 'disputed') disputedCount++;
    });

    return { totalHours, totalOvertime, pendingCount, disputedCount };
  }, [weekTimesheets]);

  // Handlers
  const handlePrevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const handleToday = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  const handleToggleStaff = (staffId: string) => {
    setSelectedStaffIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedStaffIds.size === staffMembers.length) {
      setSelectedStaffIds(new Set());
    } else {
      setSelectedStaffIds(new Set(staffMembers.map((s) => s.id)));
    }
  };

  const handleBulkApprove = useCallback(async () => {
    // Get all pending timesheet IDs for selected staff
    const pendingIds = weekTimesheets
      .filter(
        (ts) => ts.status === 'pending' && selectedStaffIds.has(ts.staffId)
      )
      .map((ts) => ts.id);

    if (pendingIds.length > 0) {
      await dispatch(
        bulkApproveTimesheets({
          timesheetIds: pendingIds,
          context: { userId: 'manager', deviceId: 'web', storeId },
        })
      ).unwrap();
      setSelectedStaffIds(new Set());
    }
  }, [dispatch, weekTimesheets, selectedStaffIds, storeId]);

  const handleApproveTimesheet = async () => {
    if (!selectedTimesheet) return;
    await dispatch(
      approveTimesheet({
        timesheetId: selectedTimesheet.id,
        context: { userId: 'manager', deviceId: 'web', storeId },
      })
    ).unwrap();
    setSelectedTimesheet(null);
  };

  const handleDisputeTimesheet = async (reason: string) => {
    if (!selectedTimesheet) return;
    await dispatch(
      disputeTimesheet({
        timesheetId: selectedTimesheet.id,
        reason,
        context: { userId: 'manager', deviceId: 'web', storeId },
      })
    ).unwrap();
    setSelectedTimesheet(null);
  };

  const getStaffName = (staffId: string) => {
    return staffMembers.find((s) => s.id === staffId)?.name || 'Unknown';
  };

  // Filter staff based on status filter
  const filteredStaffMembers = useMemo(() => {
    if (filterStatus === 'all') return staffMembers;
    return staffMembers.filter((staff) => {
      const staffTimesheets = timesheetsByStaff[staff.id] || [];
      return staffTimesheets.some((ts) => ts.status === filterStatus);
    });
  }, [staffMembers, filterStatus, timesheetsByStaff]);

  // Count pending approvals for selected staff
  const selectedPendingCount = useMemo(() => {
    return weekTimesheets.filter(
      (ts) => ts.status === 'pending' && selectedStaffIds.has(ts.staffId)
    ).length;
  }, [weekTimesheets, selectedStaffIds]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Timesheet Dashboard"
        subtitle="Review and approve staff timesheets"
        icon={<Calendar className="w-5 h-5" />}
        action={
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'week', label: 'Weekly View', icon: <Calendar className="w-4 h-4" /> },
          {
            id: 'pending',
            label: 'Pending Approval',
            icon: <Clock className="w-4 h-4" />,
            badge: weeklyTotals.pendingCount > 0 ? weeklyTotals.pendingCount : undefined,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Week Navigation */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-gray-800 min-w-[200px] text-center">
              {formatWeekRange(weekStart)}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Select
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as TimesheetStatus | 'all')}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'disputed', label: 'Disputed' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">Total Hours</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatHours(weeklyTotals.totalHours)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">Overtime</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatHours(weeklyTotals.totalOvertime)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{weeklyTotals.pendingCount}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-1">Disputed</p>
          <p className="text-2xl font-bold text-red-600">{weeklyTotals.disputedCount}</p>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedStaffIds.size > 0 && (
        <Card className="bg-cyan-50 border-cyan-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              <span className="font-medium text-cyan-800">
                {selectedStaffIds.size} staff selected
                {selectedPendingCount > 0 && ` (${selectedPendingCount} pending)`}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkApprove}
                disabled={selectedPendingCount === 0}
                loading={isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve All Pending
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStaffIds(new Set())}>
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Timesheet Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedStaffIds.size === staffMembers.length}
                      onChange={handleSelectAll}
                    />
                    <span className="font-medium text-gray-600 text-sm">Staff</span>
                  </div>
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.date}
                    className={`px-2 py-3 text-center text-sm font-medium
                      ${day.isToday ? 'bg-cyan-50' : ''}
                    `}
                  >
                    <div className="text-gray-500">{day.dayName}</div>
                    <div
                      className={`
                        text-lg font-semibold
                        ${day.isToday ? 'text-cyan-600' : 'text-gray-800'}
                      `}
                    >
                      {day.dayNumber}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right">
                  <span className="font-medium text-gray-600 text-sm">Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffMembers.map((staff) => (
                <TimesheetRow
                  key={staff.id}
                  staffId={staff.id}
                  staffName={staff.name}
                  weekDays={weekDays}
                  timesheets={timesheetsByStaff[staff.id] || []}
                  isSelected={selectedStaffIds.has(staff.id)}
                  onToggleSelect={() => handleToggleStaff(staff.id)}
                  onViewDetails={setSelectedTimesheet}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-800">TOTALS</td>
                {weekDays.map((day) => {
                  const dayTotal = weekTimesheets
                    .filter((ts) => ts.date === day.date)
                    .reduce((sum, ts) => sum + ts.hours.actualHours, 0);
                  return (
                    <td key={day.date} className="px-2 py-3 text-center font-semibold text-gray-800">
                      {dayTotal > 0 ? formatHours(dayTotal) : '-'}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-bold text-gray-800">
                  {formatHours(weeklyTotals.totalHours)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>Disputed</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Pending Approval</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-50 rounded border border-amber-200" />
          <span>Variance from schedule</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTimesheet && (
        <TimesheetDetailModal
          timesheet={selectedTimesheet}
          staffName={getStaffName(selectedTimesheet.staffId)}
          onClose={() => setSelectedTimesheet(null)}
          onApprove={handleApproveTimesheet}
          onDispute={handleDisputeTimesheet}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default TimesheetDashboard;
