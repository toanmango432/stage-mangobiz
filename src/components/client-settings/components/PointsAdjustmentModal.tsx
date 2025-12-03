import React, { useState } from 'react';
import { Button, Select, Textarea } from './SharedComponents';

interface PointsAdjustmentModalProps {
  clientName: string;
  currentBalance: number;
  type: 'add' | 'redeem';
  onAdjust: (amount: number, reason: string, notes?: string) => void;
  onClose: () => void;
}

const ADD_REASONS = [
  { value: 'purchase', label: 'Purchase Points' },
  { value: 'bonus', label: 'Bonus Points' },
  { value: 'promotion', label: 'Promotion / Campaign' },
  { value: 'referral', label: 'Referral Reward' },
  { value: 'birthday', label: 'Birthday Bonus' },
  { value: 'correction', label: 'Correction / Adjustment' },
  { value: 'tier_upgrade', label: 'Tier Upgrade Bonus' },
  { value: 'other', label: 'Other' },
];

const REDEEM_REASONS = [
  { value: 'discount', label: 'Discount on Service' },
  { value: 'product', label: 'Free Product' },
  { value: 'service', label: 'Free Service' },
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'correction', label: 'Correction / Adjustment' },
  { value: 'expiry', label: 'Points Expiry' },
  { value: 'other', label: 'Other' },
];

export const PointsAdjustmentModal: React.FC<PointsAdjustmentModalProps> = ({
  clientName,
  currentBalance,
  type,
  onAdjust,
  onClose,
}) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reasons = type === 'add' ? ADD_REASONS : REDEEM_REASONS;
  const isAdd = type === 'add';

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const amountNum = parseInt(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid positive amount';
    }

    if (!isAdd && amountNum > currentBalance) {
      newErrors.amount = `Cannot redeem more than current balance (${currentBalance.toLocaleString()})`;
    }

    if (!reason) {
      newErrors.reason = 'Please select a reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onAdjust(parseInt(amount), reason, notes.trim() || undefined);
  };

  const newBalance = isAdd
    ? currentBalance + (parseInt(amount) || 0)
    : currentBalance - (parseInt(amount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${isAdd ? 'bg-green-50' : 'bg-orange-50'} border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAdd ? 'bg-green-100' : 'bg-orange-100'}`}>
                {isAdd ? (
                  <PlusIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <MinusIcon className="w-5 h-5 text-orange-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isAdd ? 'Add Points' : 'Redeem Points'}
                </h2>
                <p className="text-sm text-gray-500">{clientName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Current Balance */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Balance</span>
            <span className="text-xl font-bold text-gray-900">
              {currentBalance.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter points"
                min="1"
                max={!isAdd ? currentBalance : undefined}
                className={`
                  w-full px-4 py-3 text-xl font-bold border rounded-lg
                  focus:outline-none focus:ring-2 focus:border-transparent
                  ${errors.amount
                    ? 'border-red-300 focus:ring-red-500'
                    : isAdd
                      ? 'border-gray-300 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-orange-500'
                  }
                `}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                pts
              </span>
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[100, 250, 500, 1000].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(String(quickAmount))}
                disabled={!isAdd && quickAmount > currentBalance}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
                  ${!isAdd && quickAmount > currentBalance
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : amount === String(quickAmount)
                      ? isAdd
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                +{quickAmount}
              </button>
            ))}
          </div>

          {/* Reason */}
          <Select
            label="Reason"
            value={reason}
            onChange={setReason}
            options={reasons}
            placeholder="Select reason..."
            required
          />
          {errors.reason && (
            <p className="text-xs text-red-500 -mt-3">{errors.reason}</p>
          )}

          {/* Notes */}
          <Textarea
            label="Notes (Optional)"
            value={notes}
            onChange={setNotes}
            placeholder="Additional details about this adjustment..."
            rows={2}
          />

          {/* Preview */}
          {amount && parseInt(amount) > 0 && (
            <div className={`p-4 rounded-lg ${isAdd ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isAdd ? 'text-green-800' : 'text-orange-800'}`}>
                  New Balance
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 line-through">
                    {currentBalance.toLocaleString()}
                  </span>
                  <ArrowIcon className="w-4 h-4 text-gray-400" />
                  <span className={`text-xl font-bold ${isAdd ? 'text-green-600' : 'text-orange-600'}`}>
                    {newBalance.toLocaleString()} pts
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <button
            onClick={handleSubmit}
            className={`
              px-4 py-2 font-medium rounded-lg transition-colors
              ${isAdd
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
              }
            `}
          >
            {isAdd ? 'Add Points' : 'Redeem Points'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default PointsAdjustmentModal;
