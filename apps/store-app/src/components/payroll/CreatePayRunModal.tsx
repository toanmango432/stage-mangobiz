/**
 * CreatePayRunModal Component - Phase 3: Payroll & Pay Runs
 *
 * Modal for creating a new pay run with period selection and staff inclusion.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { AppDispatch } from '../../store';
import {
  createPayRun,
  selectPayrollSubmitting,
} from '../../store/slices/payrollSlice';
import { selectAllStaff as selectStaffMembers } from '../../store/slices/staffSlice';
import type { PayPeriodType } from '../../types/payroll';
import { getPayPeriodDates, formatPayPeriod } from '../../utils/payrollCalculation';

// ============================================
// TYPES
// ============================================

interface CreatePayRunModalProps {
  storeId: string;
  onClose: () => void;
  onSuccess?: (payRunId: string) => void;
}

// ============================================
// PAY PERIOD TYPE CONFIG
// ============================================

const PAY_PERIOD_TYPES: { type: PayPeriodType; label: string; description: string }[] = [
  { type: 'weekly', label: 'Weekly', description: 'Every week (Sunday-Saturday)' },
  { type: 'bi-weekly', label: 'Bi-Weekly', description: 'Every two weeks' },
  { type: 'semi-monthly', label: 'Semi-Monthly', description: '1st-15th and 16th-end of month' },
  { type: 'monthly', label: 'Monthly', description: 'Full calendar month' },
];

// ============================================
// PERIOD SELECTOR
// ============================================

interface PeriodSelectorProps {
  periodType: PayPeriodType;
  startDate: string;
  endDate: string;
  onPrevious: () => void;
  onNext: () => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  periodType,
  startDate,
  endDate,
  onPrevious,
  onNext,
}) => {
  const periodLabel = formatPayPeriod(startDate, endDate);
  const now = new Date();
  const endDateObj = new Date(endDate);
  const isFuture = endDateObj > now;

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
      <button
        onClick={onPrevious}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="text-center">
        <p className="text-lg font-semibold text-gray-900">{periodLabel}</p>
        <p className="text-sm text-gray-500 capitalize">
          {periodType.replace('-', ' ')} period
        </p>
        {isFuture && (
          <p className="text-xs text-amber-600 mt-1">Future period</p>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={isFuture}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// ============================================
// STAFF SELECTOR
// ============================================

interface StaffSelectorProps {
  staff: { id: string; name: string; isActive?: boolean }[];
  selectedStaffIds: Set<string>;
  onToggle: (staffId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const StaffSelector: React.FC<StaffSelectorProps> = ({
  staff,
  selectedStaffIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}) => {
  const activeStaff = staff.filter((s) => s.isActive !== false);
  const allSelected = activeStaff.length === selectedStaffIds.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">
          Include Staff ({selectedStaffIds.size} selected)
        </label>
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
        {activeStaff.map((member) => (
          <label
            key={member.id}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          >
            <input
              type="checkbox"
              checked={selectedStaffIds.has(member.id)}
              onChange={() => onToggle(member.id)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-brand-500 flex items-center justify-center text-white text-sm font-medium">
              {member.name.charAt(0)}
            </div>
            <span className="text-sm text-gray-900">
              {member.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CreatePayRunModal: React.FC<CreatePayRunModalProps> = ({
  storeId,
  onClose,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const submitting = useSelector(selectPayrollSubmitting);
  const staffMembers = useSelector(selectStaffMembers);

  // State
  const [periodType, setPeriodType] = useState<PayPeriodType>('bi-weekly');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(() => {
    return new Set(staffMembers.filter((s) => s.isActive !== false).map((s) => s.id));
  });

  // Calculate period dates
  const { periodStart, periodEnd } = useMemo(() => {
    return getPayPeriodDates(periodType, referenceDate);
  }, [periodType, referenceDate]);

  // Navigate periods
  const handlePreviousPeriod = useCallback(() => {
    const newRef = new Date(referenceDate);
    switch (periodType) {
      case 'weekly':
        newRef.setDate(newRef.getDate() - 7);
        break;
      case 'bi-weekly':
        newRef.setDate(newRef.getDate() - 14);
        break;
      case 'semi-monthly':
        if (newRef.getDate() <= 15) {
          newRef.setMonth(newRef.getMonth() - 1);
          newRef.setDate(20);
        } else {
          newRef.setDate(10);
        }
        break;
      case 'monthly':
        newRef.setMonth(newRef.getMonth() - 1);
        break;
    }
    setReferenceDate(newRef);
  }, [referenceDate, periodType]);

  const handleNextPeriod = useCallback(() => {
    const newRef = new Date(referenceDate);
    switch (periodType) {
      case 'weekly':
        newRef.setDate(newRef.getDate() + 7);
        break;
      case 'bi-weekly':
        newRef.setDate(newRef.getDate() + 14);
        break;
      case 'semi-monthly':
        if (newRef.getDate() <= 15) {
          newRef.setDate(20);
        } else {
          newRef.setMonth(newRef.getMonth() + 1);
          newRef.setDate(10);
        }
        break;
      case 'monthly':
        newRef.setMonth(newRef.getMonth() + 1);
        break;
    }
    setReferenceDate(newRef);
  }, [referenceDate, periodType]);

  // Staff selection handlers
  const toggleStaff = useCallback((staffId: string) => {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  }, []);

  const handleSelectAllStaff = useCallback(() => {
    setSelectedStaffIds(new Set(staffMembers.filter((s) => s.isActive !== false).map((s) => s.id)));
  }, [staffMembers]);

  const deselectAllStaff = useCallback(() => {
    setSelectedStaffIds(new Set());
  }, []);

  // Handle create
  const handleCreate = useCallback(async () => {
    if (selectedStaffIds.size === 0) return;

    try {
      const result = await dispatch(createPayRun({
        params: {
          periodStart,
          periodEnd,
          periodType,
          staffIds: Array.from(selectedStaffIds),
        },
        context: {
          userId: 'system',
          deviceId: 'device-web',
          storeId,
        },
      })).unwrap();

      if (result) {
        onSuccess?.(result.id);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create pay run:', error);
    }
  }, [dispatch, periodStart, periodEnd, periodType, selectedStaffIds, storeId, onSuccess, onClose]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">New Pay Run</h3>
              <p className="text-sm text-gray-500">Create a new payroll period</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Pay Period Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pay Period Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAY_PERIOD_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setPeriodType(item.type)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    periodType === item.type
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    periodType === item.type ? 'text-emerald-700' : 'text-gray-700'
                  }`}>
                    {item.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Period Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Period
            </label>
            <PeriodSelector
              periodType={periodType}
              startDate={periodStart}
              endDate={periodEnd}
              onPrevious={handlePreviousPeriod}
              onNext={handleNextPeriod}
            />
          </div>

          {/* Staff Selection */}
          <StaffSelector
            staff={staffMembers}
            selectedStaffIds={selectedStaffIds}
            onToggle={toggleStaff}
            onSelectAll={handleSelectAllStaff}
            onDeselectAll={deselectAllStaff}
          />

          {/* Warning for no staff */}
          {selectedStaffIds.size === 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Please select at least one staff member</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {selectedStaffIds.size} staff selected
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={selectedStaffIds.size === 0 || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Pay Run'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePayRunModal;
