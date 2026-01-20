import React from 'react';
import { Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { Card, Badge } from '../../../components/SharedComponents';
import type { RecentTimesheetsProps } from '../types';
import type { TimesheetEntry } from '@/types/timesheet';
import { formatHours } from '@/utils/overtimeCalculation';
import { MAX_RECENT_TIMESHEETS_DISPLAY } from '../constants';

/**
 * Recent timesheets list component
 * Displays a list of recent timesheet entries with status badges
 */
export const RecentTimesheets: React.FC<RecentTimesheetsProps> = ({ timesheets, onViewDetails }) => {
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

export default RecentTimesheets;
