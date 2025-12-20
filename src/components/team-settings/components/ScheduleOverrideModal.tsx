import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button } from './SharedComponents';
import {
  useBlockedTimeTypes,
  useBlockedTimeEntryMutations,
} from '@/hooks/useSchedule';
import { useScheduleContext } from '../hooks/useScheduleContext';
import { isValidTimeFormat } from '../validation/validate';
import type { BlockedTimeEntry, BlockedTimeFrequency } from '@/types/schedule';

interface ScheduleOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  existingEntry?: BlockedTimeEntry;
  defaultDate?: string;
}

interface OverrideFormState {
  date: string;
  typeId: string;
  startTime: string;
  endTime: string;
  frequency: BlockedTimeFrequency;
  repeatEndDate: string;
  notes: string;
}

export const ScheduleOverrideModal: React.FC<ScheduleOverrideModalProps> = ({
  isOpen,
  onClose,
  memberId,
  memberName,
  existingEntry,
  defaultDate,
}) => {
  const context = useScheduleContext();
  const isEditMode = !!existingEntry;

  // Get blocked time types from unified schedule database
  const { types: blockedTimeTypes, loading: typesLoading } = useBlockedTimeTypes(context?.storeId || '');
  const { create: createBlockedTime, loading: mutationLoading } = useBlockedTimeEntryMutations(context || {
    userId: '',
    userName: '',
    storeId: '',
    tenantId: '',
    deviceId: '',
  });

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Default type ID
  const defaultTypeId = blockedTimeTypes[0]?.id || '';

  // Form state
  const [form, setForm] = useState<OverrideFormState>(() => {
    if (existingEntry) {
      // Parse existing entry
      const startDateTime = new Date(existingEntry.startDateTime);
      const endDateTime = new Date(existingEntry.endDateTime);
      return {
        date: startDateTime.toISOString().split('T')[0],
        typeId: existingEntry.typeId,
        startTime: startDateTime.toTimeString().slice(0, 5),
        endTime: endDateTime.toTimeString().slice(0, 5),
        frequency: existingEntry.frequency,
        repeatEndDate: existingEntry.repeatEndDate || '',
        notes: existingEntry.notes || '',
      };
    }
    return {
      date: defaultDate || '',
      typeId: defaultTypeId,
      startTime: '09:00',
      endTime: '17:00',
      frequency: 'once' as BlockedTimeFrequency,
      repeatEndDate: '',
      notes: '',
    };
  });

  // Update default type when types load
  useEffect(() => {
    if (blockedTimeTypes.length > 0 && !form.typeId) {
      setForm(prev => ({ ...prev, typeId: blockedTimeTypes[0].id }));
    }
  }, [blockedTimeTypes, form.typeId]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Note: selectedType can be used for displaying type info if needed
  // const selectedType = blockedTimeTypes.find(t => t.id === form.typeId);

  // Validate form
  const validateForm = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!form.date) {
      newErrors.date = 'Date is required';
    }

    if (!form.typeId) {
      newErrors.typeId = 'Please select a type';
    }

    if (!isValidTimeFormat(form.startTime)) {
      newErrors.startTime = 'Use HH:mm format';
    }
    if (!isValidTimeFormat(form.endTime)) {
      newErrors.endTime = 'Use HH:mm format';
    }

    if (form.startTime >= form.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (form.frequency !== 'once' && !form.repeatEndDate) {
      newErrors.repeatEndDate = 'End date required for recurring blocks';
    }

    if (form.notes && form.notes.length > 200) {
      newErrors.notes = 'Notes must be 200 characters or less';
    }

    return newErrors;
  }, [form]);

  // Update field
  const updateField = useCallback((field: keyof OverrideFormState, value: string) => {
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

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSubmitError(null);

    try {
      // Create datetime strings
      const startDateTime = `${form.date}T${form.startTime}:00.000Z`;
      const endDateTime = `${form.date}T${form.endTime}:00.000Z`;

      // Create blocked time entry via unified schedule database
      await createBlockedTime({
        staffId: memberId,
        staffName: memberName,
        typeId: form.typeId,
        startDateTime,
        endDateTime,
        frequency: form.frequency,
        repeatEndDate: form.frequency !== 'once' ? form.repeatEndDate : null,
        notes: form.notes || null,
      });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save');
    }
  }, [context, createBlockedTime, memberId, memberName, form, validateForm, onClose]);

  if (!isOpen) return null;

  const isSubmitting = mutationLoading;

  return (
    <Modal
      title={isEditMode ? 'Edit Schedule Override' : 'Add Schedule Override'}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-5">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            min={today}
            className={`
              w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              ${errors.date ? 'border-red-300 bg-red-50' : 'border-gray-200'}
            `}
            aria-label="Override date"
            aria-invalid={!!errors.date}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-500" role="alert">{errors.date}</p>
          )}
        </div>

        {/* Block Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Block Type <span className="text-red-500">*</span>
          </label>
          {typesLoading ? (
            <div className="animate-pulse h-10 bg-gray-100 rounded-lg" />
          ) : (
            <div className="space-y-2">
              {blockedTimeTypes.map((type) => (
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
                    name="blockType"
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
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {errors.typeId && (
            <p className="mt-1 text-xs text-red-500" role="alert">{errors.typeId}</p>
          )}
        </div>

        {/* Time Range */}
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
              aria-label="End time"
            />
            {errors.endTime && (
              <p className="mt-1 text-xs text-red-500" role="alert">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <select
            value={form.frequency}
            onChange={(e) => updateField('frequency', e.target.value as BlockedTimeFrequency)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="once">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Repeat End Date (for recurring) */}
        {form.frequency !== 'once' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repeat Until <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.repeatEndDate}
              onChange={(e) => updateField('repeatEndDate', e.target.value)}
              min={form.date || today}
              className={`
                w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                ${errors.repeatEndDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              `}
              aria-label="Repeat end date"
            />
            {errors.repeatEndDate && (
              <p className="mt-1 text-xs text-red-500" role="alert">{errors.repeatEndDate}</p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="e.g., Doctor appointment, Training"
            maxLength={200}
            className={`
              w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
              ${errors.notes ? 'border-red-300 bg-red-50' : 'border-gray-200'}
            `}
          />
          <div className="flex justify-between mt-1">
            {errors.notes ? (
              <p className="text-xs text-red-500">{errors.notes}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">{form.notes.length}/200</span>
          </div>
        </div>

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
              'Update Override'
            ) : (
              'Save Override'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Icons
const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default ScheduleOverrideModal;
