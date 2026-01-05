import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Modal, Button } from './SharedComponents';
import {
  useTimeOffTypes,
  useTimeOffRequestMutations,
} from '@/hooks/useSchedule';
import { useScheduleContext } from '../hooks/useScheduleContext';
import type { TimeOffRequest as ScheduleTimeOffRequest } from '@/types/schedule';

interface TimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  existingRequest?: ScheduleTimeOffRequest;
}

interface TimeOffFormState {
  startDate: string;
  endDate: string;
  typeId: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  notes: string;
}

export const TimeOffModal: React.FC<TimeOffModalProps> = ({
  isOpen,
  onClose,
  memberId,
  memberName,
  existingRequest,
}) => {
  const context = useScheduleContext();
  const isEditMode = !!existingRequest;

  // Get time-off types from unified schedule database
  const { types: timeOffTypes, loading: typesLoading } = useTimeOffTypes(context?.storeId || '');
  const { create: createTimeOffRequest, loading: mutationLoading } = useTimeOffRequestMutations(context || {
    userId: '',
    userName: '',
    storeId: '',
    tenantId: '',
    deviceId: '',
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Default type ID
  const defaultTypeId = timeOffTypes[0]?.id || '';

  // Form state
  const [form, setForm] = useState<TimeOffFormState>(() => ({
    startDate: existingRequest?.startDate || '',
    endDate: existingRequest?.endDate || '',
    typeId: existingRequest?.typeId || defaultTypeId,
    isAllDay: existingRequest?.isAllDay ?? true,
    startTime: existingRequest?.startTime || '09:00',
    endTime: existingRequest?.endTime || '17:00',
    notes: existingRequest?.notes || '',
  }));

  // Update default type when types load
  useEffect(() => {
    if (timeOffTypes.length > 0 && !form.typeId) {
      setForm(prev => ({ ...prev, typeId: timeOffTypes[0].id }));
    }
  }, [timeOffTypes, form.typeId]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get selected type details
  const selectedType = useMemo(() => {
    return timeOffTypes.find(t => t.id === form.typeId);
  }, [timeOffTypes, form.typeId]);

  // Validation
  const validateForm = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!form.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (form.startDate < today && !isEditMode) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    if (!form.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (form.endDate < form.startDate) {
      newErrors.endDate = 'End date must be on or after start date';
    }

    if (!form.typeId) {
      newErrors.typeId = 'Please select a time-off type';
    }

    if (!form.isAllDay) {
      if (!form.startTime) {
        newErrors.startTime = 'Start time is required for partial days';
      }
      if (!form.endTime) {
        newErrors.endTime = 'End time is required for partial days';
      }
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (form.notes && form.notes.length > 500) {
      newErrors.notes = 'Notes must be 500 characters or less';
    }

    return newErrors;
  }, [form, today, isEditMode]);

  // Calculate duration
  const duration = useMemo(() => {
    if (!form.startDate || !form.endDate) return null;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [form.startDate, form.endDate]);

  // Handle form field changes
  const updateField = useCallback((field: keyof TimeOffFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setSubmitError(null);
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!context) {
      setSubmitError('Authentication required');
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitError(null);

    try {
      // Create new time-off request via unified schedule database
      await createTimeOffRequest({
        staffId: memberId,
        staffName: memberName,
        typeId: form.typeId,
        startDate: form.startDate,
        endDate: form.endDate,
        isAllDay: form.isAllDay,
        startTime: form.isAllDay ? null : form.startTime,
        endTime: form.isAllDay ? null : form.endTime,
        notes: form.notes || null,
      });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit request');
    }
  }, [context, createTimeOffRequest, memberId, memberName, form, validateForm, onClose]);

  if (!isOpen) return null;

  const isSubmitting = mutationLoading;

  return (
    <Modal
      title={isEditMode ? 'Edit Time Off Request' : 'Request Time Off'}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-5">
        {/* Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type of Time Off <span className="text-red-500">*</span>
          </label>
          {typesLoading ? (
            <div className="animate-pulse h-10 bg-gray-100 rounded-lg" />
          ) : (
            <div className="space-y-2">
              {timeOffTypes.map((type) => (
                <label
                  key={type.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors
                    ${form.typeId === type.id
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="timeOffType"
                    value={type.id}
                    checked={form.typeId === type.id}
                    onChange={() => updateField('typeId', type.id)}
                    className="text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xl">{type.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{type.name}</div>
                    <div className="text-sm text-gray-500">
                      {type.isPaid ? 'Paid' : 'Unpaid'}
                      {type.requiresApproval ? ' • Requires approval' : ' • Auto-approved'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {errors.typeId && (
            <p className="mt-1 text-xs text-red-500" role="alert">
              {errors.typeId}
            </p>
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
              aria-label="Start date"
              aria-invalid={!!errors.startDate}
              aria-describedby={errors.startDate ? 'startDate-error' : undefined}
            />
            {errors.startDate && (
              <p id="startDate-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.startDate}
              </p>
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
              aria-label="End date"
              aria-invalid={!!errors.endDate}
              aria-describedby={errors.endDate ? 'endDate-error' : undefined}
            />
            {errors.endDate && (
              <p id="endDate-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.endDate}
              </p>
            )}
          </div>
        </div>

        {/* All Day Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isAllDay"
            checked={form.isAllDay}
            onChange={(e) => updateField('isAllDay', e.target.checked)}
            className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 rounded"
          />
          <label htmlFor="isAllDay" className="text-sm font-medium text-gray-700">
            Full day(s)
          </label>
        </div>

        {/* Partial Day Times */}
        {!form.isAllDay && (
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
                aria-label="Start time"
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-500" role="alert">
                  {errors.startTime}
                </p>
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
                aria-label="End time"
              />
              {errors.endTime && (
                <p className="mt-1 text-xs text-red-500" role="alert">
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Duration Display */}
        {duration && (
          <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-cyan-600" />
            <span className="text-sm text-cyan-800">
              <strong>{duration}</strong> {duration === 1 ? 'day' : 'days'} requested
            </span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Add any additional details..."
            rows={3}
            maxLength={500}
            className={`
              w-full px-4 py-2.5 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              ${errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-200'}
            `}
            aria-label="Notes"
            aria-describedby="notes-count"
          />
          <div className="flex justify-between mt-1">
            {errors.notes ? (
              <p className="text-xs text-red-500">{errors.notes}</p>
            ) : (
              <span />
            )}
            <span id="notes-count" className="text-xs text-gray-400">
              {form.notes.length}/500
            </span>
          </div>
        </div>

        {/* Info Message */}
        {selectedType?.requiresApproval && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <InfoIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              This type of time off requires manager approval. You'll be notified when your request is reviewed.
            </p>
          </div>
        )}

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
                Submitting...
              </span>
            ) : isEditMode ? (
              'Update Request'
            ) : (
              'Submit Request'
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

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default TimeOffModal;
