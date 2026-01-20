import React, { useMemo } from 'react';
import { BarChart3, Timer, Calendar, Clock, Download } from 'lucide-react';
import { Card, Button } from '../../../components/SharedComponents';
import type { TimesheetReportsSectionProps } from '../types';
import type { TimesheetEntry } from '@/types/timesheet';
import { formatHours } from '@/utils/overtimeCalculation';
import { CSV_EXPORT_HEADERS } from '../constants';

/**
 * Timesheet reports section component
 * Displays monthly summary, approval status, and export functionality
 */
export const TimesheetReportsSection: React.FC<TimesheetReportsSectionProps> = ({
  timesheets,
  memberName,
}) => {
  // Calculate summary statistics
  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Filter for this month's timesheets
    const monthTimesheets = timesheets.filter((ts: TimesheetEntry) => {
      const d = new Date(ts.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    // Calculate totals
    const totalHours = monthTimesheets.reduce((sum: number, ts: TimesheetEntry) => sum + ts.hours.actualHours, 0);
    const totalOvertimeHours = monthTimesheets.reduce((sum: number, ts: TimesheetEntry) => sum + ts.hours.overtimeHours, 0);
    const totalBreakMinutes = monthTimesheets.reduce((sum: number, ts: TimesheetEntry) => sum + ts.hours.breakMinutes, 0);
    const pendingCount = monthTimesheets.filter((ts: TimesheetEntry) => ts.status === 'pending').length;
    const approvedCount = monthTimesheets.filter((ts: TimesheetEntry) => ts.status === 'approved').length;
    const disputedCount = monthTimesheets.filter((ts: TimesheetEntry) => ts.status === 'disputed').length;
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
    const rows = timesheets.map((ts: TimesheetEntry) => [
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
      ...rows.map((row: string[]) => row.join(',')),
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

export default TimesheetReportsSection;
