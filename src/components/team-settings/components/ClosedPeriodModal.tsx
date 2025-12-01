import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Toggle, Textarea } from './SharedComponents';
import { useClosedPeriodMutations } from '../../../hooks/useSchedule';
import { useScheduleContext } from '../hooks/useScheduleContext';
import type { BusinessClosedPeriod, CreateBusinessClosedPeriodInput } from '../../../types/schedule';

interface ClosedPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPeriod?: BusinessClosedPeriod;
}

interface FormState {
  name: string;
  startDate: string;
  endDate: string;
  isPartialDay: boolean;
  startTime: string;
  endTime: string;
  blocksOnlineBooking: boolean;
  blocksInStoreBooking: boolean;
  isAnnual: boolean;
  notes: string;
}

const DEFAULT_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#0EA5E9', // sky
  '#6366F1', // indigo
  '#8B5CF6', // violet
];

export const ClosedPeriodModal: React.FC<ClosedPeriodModalProps> = ({
  isOpen,
  onClose,
  existingPeriod,
}) => {
  const context = useScheduleContext();
  const isEditMode = !!existingPeriod;

  const { create, update, loading: mutationLoading } = useClosedPeriodMutations(context || {
    userId: '',
    userName: '',
    storeId: '',
    tenantId: '',
    deviceId: '',
  });

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Form state
  const [form, setForm] = useState<FormState>(() => {
    if (existingPeriod) {
      return {
        name: existingPeriod.name,
        startDate: existingPeriod.startDate,
        endDate: existingPeriod.endDate,
        isPartialDay: existingPeriod.isPartialDay,
        startTime: existingPeriod.startTime || '14:00',
        endTime: existingPeriod.endTime || '17:00',
        blocksOnlineBooking: existingPeriod.blocksOnlineBooking,
        blocksInStoreBooking: existingPeriod.blocksInStoreBooking,
        isAnnual: existingPeriod.isAnnual,
        notes: existingPeriod.notes || '',
      };
    }
    return {
      name: '',
      startDate: '',
      endDate: '',
      isPartialDay: false,
      startTime: '14:00',
      endTime: '17:00',
      blocksOnlineBooking: true,
      blocksInStoreBooking: true,
      isAnnual: false,
      notes: '',
    };
  });

  const [selectedColor, setSelectedColor] = useState<string>(
    existingPeriod?.color || DEFAULT_COLORS[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && existingPeriod) {
      setForm({
        name: existingPeriod.name,
        startDate: existingPeriod.startDate,
        endDate: existingPeriod.endDate,
        isPartialDay: existingPeriod.isPartialDay,
        startTime: existingPeriod.startTime || '14:00',
        endTime: existingPeriod.endTime || '17:00',
        blocksOnlineBooking: existingPeriod.blocksOnlineBooking,
        blocksInStoreBooking: existingPeriod.blocksInStoreBooking,
        isAnnual: existingPeriod.isAnnual,
        notes: existingPeriod.notes || '',
      });
      setSelectedColor(existingPeriod.color);
    } else if (isOpen && !existingPeriod) {
      setForm({
        name: '',
        startDate: '',
        endDate: '',
        isPartialDay: false,
        startTime: '14:00',
        endTime: '17:00',
        blocksOnlineBooking: true,
        blocksInStoreBooking: true,
        isAnnual: false,
        notes: '',
      });
      setSelectedColor(DEFAULT_COLORS[0]);
    }
    setErrors({});
    setSubmitError(null);
  }, [isOpen, existingPeriod]);

  // Validation
  const validateForm = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (!form.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!form.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (form.endDate < form.startDate) {
      newErrors.endDate = 'End date must be on or after start date';
    }

    if (form.isPartialDay) {
      if (!form.startTime) {
        newErrors.startTime = 'Start time is required';
      }
      if (!form.endTime) {
        newErrors.endTime = 'End time is required';
      }
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (form.notes && form.notes.length > 500) {
      newErrors.notes = 'Notes must be 500 characters or less';
    }

    return newErrors;
  }, [form]);

  // Update field
  const updateField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setSubmitError(null);
  }, []);

  // Calculate duration
  const duration = form.startDate && form.endDate
    ? Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null;

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!context) {
      setSubmitError('Authentication required');
      return;
    }

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSubmitError(null);

    try {
      const input: CreateBusinessClosedPeriodInput = {
        name: form.name.trim(),
        appliesToAllLocations: true,
        locationIds: [],
        startDate: form.startDate,
        endDate: form.endDate,
        isPartialDay: form.isPartialDay,
        startTime: form.isPartialDay ? form.startTime : null,
        endTime: form.isPartialDay ? form.endTime : null,
        blocksOnlineBooking: form.blocksOnlineBooking,
        blocksInStoreBooking: form.blocksInStoreBooking,
        color: selectedColor,
        notes: form.notes.trim() || null,
        isAnnual: form.isAnnual,
      };

      if (isEditMode && existingPeriod) {
        await update(existingPeriod.id, input);
      } else {
        await create(input);
      }
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save');
    }
  }, [context, create, update, form, selectedColor, validateForm, onClose, isEditMode, existingPeriod]);

  if (!isOpen) return null;

  const isSubmitting = mutationLoading;

  return (
    <Modal
      title={isEditMode ? 'Edit Business Closure' : 'Add Business Closure'}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Christmas Day, Staff Training"
            maxLength={100}
            className={`
              w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'}
            `}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500" role="alert">{errors.name}</p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              min={isEditMode ? undefined : today}
              className={`
                w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                ${errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              `}
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-500" role="alert">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              min={form.startDate || today}
              className={`
                w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                ${errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              `}
            />
            {errors.endDate && (
              <p className="mt-1 text-xs text-red-500" role="alert">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Duration Display */}
        {duration && duration > 0 && (
          <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-cyan-600" />
            <span className="text-sm text-cyan-800">
              <strong>{duration}</strong> {duration === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}

        {/* Partial Day Toggle */}
        <Toggle
          enabled={form.isPartialDay}
          onChange={(enabled) => updateField('isPartialDay', enabled)}
          label="Partial day closure"
          description="Close for only part of the day"
        />

        {/* Partial Day Times */}
        {form.isPartialDay && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                className={`
                  w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                  ${errors.startTime ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                `}
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-500" role="alert">{errors.startTime}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                className={`
                  w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                  ${errors.endTime ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                `}
              />
              {errors.endTime && (
                <p className="mt-1 text-xs text-red-500" role="alert">{errors.endTime}</p>
              )}
            </div>
          </div>
        )}

        {/* Color Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Color
          </label>
          <div className="flex gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`
                  w-8 h-8 rounded-full transition-all
                  ${selectedColor === color ? 'ring-2 ring-offset-2 ring-cyan-500' : 'hover:scale-110'}
                `}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color} color`}
              />
            ))}
          </div>
        </div>

        {/* Booking Options */}
        <div className="space-y-3">
          <Toggle
            enabled={form.blocksOnlineBooking}
            onChange={(enabled) => updateField('blocksOnlineBooking', enabled)}
            label="Block online booking"
            description="Prevent customers from booking online during closure"
          />
          <Toggle
            enabled={form.blocksInStoreBooking}
            onChange={(enabled) => updateField('blocksInStoreBooking', enabled)}
            label="Block in-store booking"
            description="Prevent staff from creating appointments during closure"
          />
        </div>

        {/* Annual Repeat */}
        <Toggle
          enabled={form.isAnnual}
          onChange={(enabled) => updateField('isAnnual', enabled)}
          label="Repeat annually"
          description="Automatically repeat this closure every year"
        />

        {/* Notes */}
        <Textarea
          label="Notes (optional)"
          value={form.notes}
          onChange={(value) => updateField('notes', value)}
          placeholder="Add any additional details..."
          rows={3}
          maxLength={500}
          error={errors.notes}
        />

        {/* Submit Error */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !context}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <SpinnerIcon className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : isEditMode ? (
              'Update Closure'
            ) : (
              'Add Closure'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Icons
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default ClosedPeriodModal;
