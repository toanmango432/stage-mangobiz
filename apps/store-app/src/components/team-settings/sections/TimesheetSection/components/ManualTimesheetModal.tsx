import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, Plus, Calendar, User } from 'lucide-react';
import { Card, Button, Modal, Input, Select, Textarea } from '../../../components/SharedComponents';
import type { AppDispatch } from '@/store';
import { createTimesheet, selectTimesheetLoading } from '@/store/slices/timesheetSlice';
import { selectAllTeamMembers } from '@/store/slices/teamSlice';
import { useToast } from '@/hooks/use-toast';
import { format, parse, isValid, differenceInMinutes } from 'date-fns';

// ============================================
// TYPES
// ============================================

interface ManualTimesheetModalProps {
  /** Pre-selected staff ID (optional) */
  defaultStaffId?: string;
  /** Store ID for the timesheet */
  storeId: string;
  /** Close modal callback */
  onClose: () => void;
}

interface FormData {
  staffId: string;
  date: string;
  clockInTime: string;
  clockOutTime: string;
  breakDuration: string;
  notes: string;
}

interface FormErrors {
  staffId?: string;
  date?: string;
  clockInTime?: string;
  clockOutTime?: string;
  breakDuration?: string;
  notes?: string;
}

// ============================================
// VALIDATION
// ============================================

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  // Staff ID required
  if (!data.staffId) {
    errors.staffId = 'Please select a staff member';
  }

  // Date required and must be valid
  if (!data.date) {
    errors.date = 'Date is required';
  } else {
    const parsedDate = parse(data.date, 'yyyy-MM-dd', new Date());
    if (!isValid(parsedDate)) {
      errors.date = 'Invalid date format';
    } else if (parsedDate > new Date()) {
      errors.date = 'Date cannot be in the future';
    }
  }

  // Clock in time required
  if (!data.clockInTime) {
    errors.clockInTime = 'Clock in time is required';
  }

  // Clock out time required and must be after clock in
  if (!data.clockOutTime) {
    errors.clockOutTime = 'Clock out time is required';
  } else if (data.clockInTime && data.clockOutTime) {
    const clockIn = parse(data.clockInTime, 'HH:mm', new Date());
    const clockOut = parse(data.clockOutTime, 'HH:mm', new Date());
    if (isValid(clockIn) && isValid(clockOut) && clockOut <= clockIn) {
      errors.clockOutTime = 'Clock out must be after clock in';
    }
  }

  // Break duration must be a positive number if provided
  if (data.breakDuration) {
    const breakMins = parseInt(data.breakDuration, 10);
    if (isNaN(breakMins) || breakMins < 0) {
      errors.breakDuration = 'Break duration must be a positive number';
    } else if (breakMins > 480) {
      errors.breakDuration = 'Break duration cannot exceed 8 hours';
    }
  }

  return errors;
}

// ============================================
// COMPONENT
// ============================================

export const ManualTimesheetModal: React.FC<ManualTimesheetModalProps> = ({
  defaultStaffId = '',
  storeId,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const isLoading = useSelector(selectTimesheetLoading);
  const allMembers = useSelector(selectAllTeamMembers);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    staffId: defaultStaffId,
    date: format(new Date(), 'yyyy-MM-dd'),
    clockInTime: '',
    clockOutTime: '',
    breakDuration: '0',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Convert team members to select options
  const staffOptions = useMemo(
    () =>
      allMembers.map((member) => ({
        value: member.id,
        label: member.profile.displayName,
      })),
    [allMembers]
  );

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

  // Calculate shift duration for preview
  const shiftPreview = useMemo(() => {
    if (!formData.clockInTime || !formData.clockOutTime) {
      return null;
    }

    try {
      const clockIn = parse(formData.clockInTime, 'HH:mm', new Date());
      const clockOut = parse(formData.clockOutTime, 'HH:mm', new Date());

      if (!isValid(clockIn) || !isValid(clockOut) || clockOut <= clockIn) {
        return null;
      }

      const totalMinutes = differenceInMinutes(clockOut, clockIn);
      const breakMinutes = parseInt(formData.breakDuration, 10) || 0;
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
  }, [formData.clockInTime, formData.clockOutTime, formData.breakDuration]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    // Mark all fields as touched
    setTouched({
      staffId: true,
      date: true,
      clockInTime: true,
      clockOutTime: true,
      breakDuration: true,
      notes: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      // Build ISO timestamps from date and time inputs
      const baseDate = parse(formData.date, 'yyyy-MM-dd', new Date());
      const clockInDate = parse(formData.clockInTime, 'HH:mm', baseDate);
      const clockOutDate = parse(formData.clockOutTime, 'HH:mm', baseDate);

      const scheduledStart = clockInDate.toISOString();
      const scheduledEnd = clockOutDate.toISOString();

      // Create timesheet via Redux thunk
      await dispatch(
        createTimesheet({
          staffId: formData.staffId,
          date: formData.date,
          scheduledStart,
          scheduledEnd,
        })
      ).unwrap();

      toast({
        title: 'Timesheet Created',
        description: 'Manual timesheet entry has been added successfully.',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create timesheet',
        variant: 'destructive',
      });
    }
  };

  return (
    <Modal title="Add Manual Timesheet" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Staff Selector */}
        <Select
          label="Staff Member"
          value={formData.staffId}
          onChange={(value) => updateField('staffId', value)}
          options={staffOptions}
          placeholder="Select a staff member"
          error={touched.staffId ? errors.staffId : undefined}
          required
        />

        {/* Date */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => updateField('date', e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className={`
                block w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm
                ${touched.date && errors.date
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-cyan-500 focus:ring-cyan-500'
                }
                focus:outline-none focus:ring-2 focus:ring-opacity-50
              `}
            />
          </div>
          {touched.date && errors.date && (
            <p className="text-xs text-red-500">{errors.date}</p>
          )}
        </div>

        {/* Time Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Clock In Time"
            type="time"
            value={formData.clockInTime}
            onChange={(value) => updateField('clockInTime', value)}
            error={touched.clockInTime ? errors.clockInTime : undefined}
            required
            prefix={<Clock className="w-4 h-4" />}
          />
          <Input
            label="Clock Out Time"
            type="time"
            value={formData.clockOutTime}
            onChange={(value) => updateField('clockOutTime', value)}
            error={touched.clockOutTime ? errors.clockOutTime : undefined}
            required
            prefix={<Clock className="w-4 h-4" />}
          />
        </div>

        {/* Break Duration */}
        <Input
          label="Break Duration (minutes)"
          type="number"
          value={formData.breakDuration}
          onChange={(value) => updateField('breakDuration', value)}
          error={touched.breakDuration ? errors.breakDuration : undefined}
          placeholder="0"
        />

        {/* Shift Preview */}
        {shiftPreview && (
          <Card className="bg-cyan-50 border-cyan-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-800">Shift Preview</p>
                <p className="text-xs text-cyan-600">
                  Total time: {Math.floor(shiftPreview.totalMinutes / 60)}h {shiftPreview.totalMinutes % 60}m
                  {shiftPreview.breakMinutes > 0 && ` | Break: ${shiftPreview.breakMinutes}m`}
                  {' | '}Worked: {shiftPreview.formattedWorked}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Notes */}
        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(value) => updateField('notes', value)}
          placeholder="Add any notes about this manual entry (optional)"
          rows={3}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            fullWidth
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Timesheet
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualTimesheetModal;
