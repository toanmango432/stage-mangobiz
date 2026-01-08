import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Gift } from 'lucide-react';
import type { GiftCardDenomination } from '@/types/catalog';

interface GiftCardDenominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  denomination?: GiftCardDenomination;
  onSave: (data: Partial<GiftCardDenomination>) => Promise<void> | void;
}

export function GiftCardDenominationModal({
  isOpen,
  onClose,
  denomination,
  onSave,
}: GiftCardDenominationModalProps) {
  const [amount, setAmount] = useState(50);
  const [label, setLabel] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (denomination) {
        setAmount(denomination.amount);
        setLabel(denomination.label || '');
        setIsActive(denomination.isActive);
      } else {
        setAmount(50);
        setLabel('');
        setIsActive(true);
      }
    }
  }, [isOpen, denomination]);

  const handleSave = async () => {
    if (amount <= 0) return;

    setIsSaving(true);
    try {
      await onSave({
        amount,
        label: label.trim() || undefined,
        isActive,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save denomination:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, amount, label, isActive]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {denomination ? 'Edit Denomination' : 'New Gift Card Denomination'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="px-6 pt-6 pb-4">
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-6 text-white text-center">
            <Gift size={32} className="mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">${amount}</p>
            <p className="text-sm opacity-80 mt-1">
              {label || 'Gift Card'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Common amounts: $25, $50, $75, $100, $150, $200
            </p>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Birthday Gift Card"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional label for display. Defaults to "Gift Card" if empty.
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Active</p>
              <p className="text-sm text-gray-500">Show this denomination at checkout</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={amount <= 0 || isSaving}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : denomination ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default GiftCardDenominationModal;
