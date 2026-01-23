import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, AlertCircle, FileText } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Textarea } from '../../../components/SharedComponents';
import type { AppDispatch } from '@/store';
import { disputeTimesheet, selectTimesheetLoading } from '@/store/slices/timesheetSlice';
import { useToast } from '@/hooks/use-toast';
import type { TimesheetEntry } from '@/types/timesheet';
import { formatHours } from '@/utils/overtimeCalculation';
import { parse, isValid, differenceInMinutes } from 'date-fns';

// ============================================
// TYPES
// ============================================

export interface DisputeTimesheetModalProps {
  /** Timesheet to dispute */
  timesheet: TimesheetEntry;
  /** Staff member name for display */
  memberName: string;
  /** Store ID */
  storeId: string;
  /** Close modal callback */
  onClose: () => void;
}

interface FormData {
  reason: string;
  suggestedClockIn: string;
  suggestedClockOut: string;
  suggestedBreakMinutes: string;
}

interface FormErrors {
  reason?: string;
  suggestedClockIn?: string;
  suggestedClockOut?: string;
  suggestedBreakMinutes?: string;
}

// ============================================
// VALIDATION
// ============================================

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  // Reason required with minimum 10 characters
  if (!data.reason.trim()) {
    errors.reason = 'Please provide a reason for the dispute';
  } else if (data.reason.trim().length < 10) {
    errors.reason = 'Reason must be at least 10 characters';
  }

  // If suggested times are provided, validate them
  if (data.suggestedClockIn && data.suggestedClockOut) {
    const clockIn = parse(data.suggestedClockIn, 'HH:mm', new Date());
    const clockOut = parse(data.suggestedClockOut, 'HH:mm', new Date());
    if (isValid(clockIn) && isValid(clockOut) && clockOut <= clockIn) {
      errors.suggestedClockOut = 'Clock out must be after clock in';
    }
  }

  // Break minutes must be valid if provided
  if (data.suggestedBreakMinutes) {
    const breakMins = parseInt(data.suggestedBreakMinutes, 10);
    if (isNaN(breakMins) || breakMins < 0) {
      errors.suggestedBreakMinutes = 'Must be a positive number';
    } else if (breakMins > 480) {
      errors.suggestedBreakMinutes = 'Cannot exceed 8 hours';
    }
  }

  return errors;
}

// ============================================
// COMPONENT
// ============================================

export const DisputeTimesheetModal: React.FC<DisputeTimesheetModalProps> = ({
  timesheet,
  memberName,
  storeId,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const isLoading = useSelector(selectTimesheetLoading);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    reason: '',
    suggestedClockIn: '',
    suggestedClockOut: '',
    suggestedBreakMinutes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Format time for display
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Update form field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Calculate suggested shift preview if times are provided
  const suggestedPreview = useMemo(() => {
    if (!formData.suggestedClockIn || !formData.suggestedClockOut) {
      return null;
    }

    try {
      const clockIn = parse(formData.suggestedClockIn, 'HH:mm', new Date());
      const clockOut = parse(formData.suggestedClockOut, 'HH:mm', new Date());

      if (!isValid(clockIn) || !isValid(clockOut) || clockOut <= clockIn) {
        return null;
      }

      const totalMinutes = differenceInMinutes(clockOut, clockIn);
      const breakMinutes = parseInt(formData.suggestedBreakMinutes, 10) || 0;
      const workedMinutes = totalMinutes - breakMinutes;
      const hours = Math.floor(workedMinutes / 60);
      const minutes = workedMinutes % 60;

      return {
        totalMinutes,
        breakMinutes,
        workedMinutes,
        formattedWorked: `${hours}h ${minutes}m`,
      };
    } catch {
      return null;
    }
  }, [formData.suggestedClockIn, formData.suggestedClockOut, formData.suggestedBreakMinutes]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    // Mark reason as touched
    setTouched({ reason: true });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      // Build dispute reason with suggested corrections
      let fullReason = formData.reason.trim();

      if (formData.suggestedClockIn || formData.suggestedClockOut || formData.suggestedBreakMinutes) {
        fullReason += '\n\n--- Suggested Corrections ---';
        if (formData.suggestedClockIn) {
          fullReason += `\nClock In: ${formData.suggestedClockIn}`;
        }
        if (formData.suggestedClockOut) {
          fullReason += `\nClock Out: ${formData.suggestedClockOut}`;
        }
        if (formData.suggestedBreakMinutes) {
          fullReason += `\nBreak Time: ${formData.suggestedBreakMinutes} minutes`;
        }
      }

      // Submit dispute via Redux thunk
      await dispatch(
        disputeTimesheet({
          timesheetId: timesheet.id,
          reason: fullReason,
        })
      ).unwrap();

      toast({
        title: 'Dispute Submitted',
        description: 'Your timesheet dispute has been submitted for review.',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit dispute',
        variant: 'destructive',
      });
    }
  };

  return (
    <Modal title="Dispute Timesheet" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Timesheet Info (Read-Only) */}
        <Card className="bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-800">{memberName}</span>
            </div>
            <Badge variant="warning" size="md">
              {timesheet.status === 'pending' ? 'Pending Approval' : timesheet.status}
            </Badge>
          </div>

          <p className="text-sm text-gray-500 mb-3">{formatDate(timesheet.date)}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Recorded Times</p>
              <p className="font-medium text-gray-800">
                {formatTime(timesheet.actualClockIn)} - {formatTime(timesheet.actualClockOut)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Total Hours</p>
              <p className="font-medium text-gray-800">
                {formatHours(timesheet.hours.actualHours)} hours
              </p>
            </div>
          </div>

          {timesheet.hours.breakMinutes > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-gray-500">Break Time: </span>
              <span className="font-medium text-gray-800">{timesheet.hours.breakMinutes} min</span>
            </div>
          )}
        </Card>

        {/* Dispute Reason (Required) */}
        <Textarea
          label="Reason for Dispute"
          value={formData.reason}
          onChange={(value) => updateField('reason', value)}
          placeholder="Please explain why you are disputing this timesheet entry. Be specific about what is incorrect (minimum 10 characters)..."
          rows={4}
          required
          error={touched.reason ? errors.reason : undefined}
        />

        {/* Suggested Corrections Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="w-4 h-4" />
            <span>Suggested Corrections (Optional)</span>
          </div>
          <p className="text-xs text-gray-500">
            If you know the correct times, please provide them below to help speed up the review process.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Suggested Clock In"
              type="time"
              value={formData.suggestedClockIn}
              onChange={(value) => updateField('suggestedClockIn', value)}
              error={touched.suggestedClockIn ? errors.suggestedClockIn : undefined}
              prefix={<Clock className="w-4 h-4" />}
            />
            <Input
              label="Suggested Clock Out"
              type="time"
              value={formData.suggestedClockOut}
              onChange={(value) => updateField('suggestedClockOut', value)}
              error={touched.suggestedClockOut ? errors.suggestedClockOut : undefined}
              prefix={<Clock className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Suggested Break Time (minutes)"
            type="number"
            value={formData.suggestedBreakMinutes}
            onChange={(value) => updateField('suggestedBreakMinutes', value)}
            error={touched.suggestedBreakMinutes ? errors.suggestedBreakMinutes : undefined}
            placeholder="0"
          />

          {/* Suggested Preview */}
          {suggestedPreview && (
            <Card className="bg-amber-50 border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Suggested Correction Preview</p>
                  <p className="text-xs text-amber-600">
                    Total: {Math.floor(suggestedPreview.totalMinutes / 60)}h{' '}
                    {suggestedPreview.totalMinutes % 60}m
                    {suggestedPreview.breakMinutes > 0 && ` | Break: ${suggestedPreview.breakMinutes}m`}
                    {' | '}Worked: {suggestedPreview.formattedWorked}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button
            type="submit"
            variant="danger"
            loading={isLoading}
            fullWidth
            disabled={!formData.reason.trim()}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Submit Dispute
          </Button>
          <Button type="button" variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DisputeTimesheetModal;
