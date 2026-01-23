/**
 * PayRunAdjustmentModal Component - Phase 3: Payroll & Pay Runs
 *
 * Modal for adding/editing adjustments to staff payments.
 * Supports bonuses, deductions, reimbursements, etc.
 */

import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  DollarSign,
  Plus,
  Minus,
  Gift,
  Receipt,
  AlertTriangle,
  CreditCard,
  Package,
  FileText,
  Percent,
  Heart,
} from 'lucide-react';
import type { AppDispatch } from '../../store';
import {
  addAdjustment,
  selectPayrollSubmitting,
} from '../../store/slices/payrollSlice';
import type { AdjustmentType, PayRunAdjustment } from '../../types/payroll';
import { formatCurrency } from '../../utils/payrollCalculation';

// ============================================
// TYPES
// ============================================

interface PayRunAdjustmentModalProps {
  payRunId: string;
  staffId: string;
  staffName: string;
  existingAdjustments?: PayRunAdjustment[];
  onClose: () => void;
  onSuccess?: () => void;
}

// ============================================
// ADJUSTMENT TYPE CONFIG
// ============================================

const ADJUSTMENT_TYPES: {
  type: AdjustmentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isPositive: boolean;
}[] = [
  { type: 'bonus', label: 'Bonus', description: 'Performance bonus or one-time payment', icon: Gift, isPositive: true },
  { type: 'reimbursement', label: 'Reimbursement', description: 'Expense reimbursement', icon: Receipt, isPositive: true },
  { type: 'tip_adjustment', label: 'Tip Adjustment', description: 'Manual tip correction', icon: Heart, isPositive: true },
  { type: 'advance', label: 'Advance', description: 'Paycheck advance deduction', icon: CreditCard, isPositive: false },
  { type: 'fee', label: 'Fee', description: 'Station rental or other fees', icon: AlertTriangle, isPositive: false },
  { type: 'supply', label: 'Supply Deduction', description: 'Product/supply purchases', icon: Package, isPositive: false },
  { type: 'tax', label: 'Tax Adjustment', description: 'Additional tax withholding', icon: Percent, isPositive: false },
  { type: 'benefits', label: 'Benefits', description: 'Health insurance, 401k, etc.', icon: Heart, isPositive: false },
  { type: 'other', label: 'Other', description: 'Custom adjustment', icon: FileText, isPositive: true },
];

// ============================================
// ADJUSTMENT TYPE SELECTOR
// ============================================

interface AdjustmentTypeSelectorProps {
  selectedType: AdjustmentType | null;
  onSelect: (type: AdjustmentType) => void;
}

const AdjustmentTypeSelector: React.FC<AdjustmentTypeSelectorProps> = ({ selectedType, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ADJUSTMENT_TYPES.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedType === item.type;

        return (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              isSelected
                ? item.isPositive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${
                isSelected
                  ? item.isPositive ? 'text-emerald-600' : 'text-red-600'
                  : 'text-gray-500'
              }`} />
              <span className={`text-sm font-medium ${
                isSelected
                  ? item.isPositive ? 'text-emerald-700' : 'text-red-700'
                  : 'text-gray-700'
              }`}>
                {item.label}
              </span>
              <span className={`ml-auto text-xs ${
                item.isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {item.isPositive ? '+' : '-'}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const PayRunAdjustmentModal: React.FC<PayRunAdjustmentModalProps> = ({
  payRunId,
  staffId,
  staffName,
  existingAdjustments = [],
  onClose,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const submitting = useSelector(selectPayrollSubmitting);

  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isNegative, setIsNegative] = useState(false);

  // Get the selected type config
  const typeConfig = adjustmentType
    ? ADJUSTMENT_TYPES.find((t) => t.type === adjustmentType)
    : null;

  // Handle type selection
  const handleTypeSelect = useCallback((type: AdjustmentType) => {
    setAdjustmentType(type);
    const config = ADJUSTMENT_TYPES.find((t) => t.type === type);
    if (config) {
      setIsNegative(!config.isPositive);
    }
  }, []);

  // Calculate final amount
  const finalAmount = useCallback(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return 0;
    return isNegative ? -Math.abs(parsed) : Math.abs(parsed);
  }, [amount, isNegative]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!adjustmentType || !amount) return;

    // Build the description including notes if provided
    const fullDescription = notes
      ? `${description || typeConfig?.label || adjustmentType} - ${notes}`
      : description || typeConfig?.label || adjustmentType;

    try {
      await dispatch(addAdjustment({
        payRunId,
        staffId,
        type: adjustmentType,
        amount: finalAmount(),
        description: fullDescription,
      }));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to add adjustment:', error);
    }
  }, [dispatch, payRunId, staffId, adjustmentType, amount, description, notes, finalAmount, typeConfig, onSuccess, onClose]);

  // Calculate existing adjustments total
  const existingTotal = existingAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

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
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add Adjustment</h3>
            <p className="text-sm text-gray-500">For {staffName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Existing Adjustments Summary */}
          {existingAdjustments.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-2">Existing Adjustments</p>
              <div className="space-y-1">
                {existingAdjustments.map((adj) => (
                  <div key={adj.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{adj.description}</span>
                    <span className={adj.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className={existingTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {existingTotal >= 0 ? '+' : ''}{formatCurrency(existingTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Adjustment Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Adjustment Type
            </label>
            <AdjustmentTypeSelector
              selectedType={adjustmentType}
              onSelect={handleTypeSelect}
            />
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNegative(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  !isNegative
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <button
                onClick={() => setIsNegative(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                  isNegative
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Minus className="w-4 h-4" />
                Deduct
              </button>
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-offset-1 transition-colors text-lg font-medium ${
                    isNegative
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 text-red-700'
                      : 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 text-emerald-700'
                  }`}
                />
              </div>
            </div>
            {amount && (
              <p className={`mt-2 text-sm font-medium ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                Final amount: {formatCurrency(finalAmount())}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={typeConfig?.label || 'Enter description...'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!adjustmentType || !amount || submitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              isNegative
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {isNegative ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {submitting ? 'Adding...' : 'Add Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayRunAdjustmentModal;
