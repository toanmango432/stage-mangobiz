import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, Badge, Button, Modal, Textarea } from '../../../components/SharedComponents';
import type { AppDispatch } from '@/store';
import {
  approveTimesheet,
  disputeTimesheet,
  selectTimesheetLoading,
} from '@/store/slices/timesheetSlice';
import type { TimesheetDetailModalProps } from '../types';
import { formatHours } from '@/utils/overtimeCalculation';

/**
 * Timesheet detail modal component
 * Shows detailed timesheet information with approve/dispute actions
 */
export const TimesheetDetailModal: React.FC<TimesheetDetailModalProps> = ({
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

export default TimesheetDetailModal;
