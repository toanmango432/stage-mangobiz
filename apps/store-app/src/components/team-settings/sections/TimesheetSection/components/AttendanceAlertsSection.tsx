import React, { useMemo } from 'react';
import { Clock, AlertTriangle, Timer, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, Badge } from '../../../components/SharedComponents';
import type { AttendanceAlertsSectionProps, DisplayAlert } from '../types';
import type { TimesheetEntry } from '@/types/timesheet';
import { formatHours } from '@/utils/overtimeCalculation';
import {
  LATE_ARRIVAL_THRESHOLD_MINUTES,
  HIGH_SEVERITY_LATE_MINUTES,
  EARLY_DEPARTURE_THRESHOLD_MINUTES,
  HIGH_SEVERITY_EARLY_MINUTES,
  HIGH_SEVERITY_OVERTIME_HOURS,
  MAX_ALERTS_DISPLAY,
  SEVERITY_STYLES,
} from '../constants';

/**
 * Attendance alerts section component
 * Generates and displays alerts for late arrivals, early departures, and overtime
 */
export const AttendanceAlertsSection: React.FC<AttendanceAlertsSectionProps> = ({
  timesheets,
  memberName,
}) => {
  // Generate display alerts based on timesheet data
  const alerts = useMemo((): DisplayAlert[] => {
    const generatedAlerts: DisplayAlert[] = [];

    timesheets.forEach((ts: TimesheetEntry) => {
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

export default AttendanceAlertsSection;
