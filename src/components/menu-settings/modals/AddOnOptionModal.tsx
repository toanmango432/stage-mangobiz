import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Zap,
} from 'lucide-react';
import type { AddOnOption } from '../../../types/catalog';
import { DURATION_OPTIONS } from '../constants';

interface AddOnOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  option?: AddOnOption;
  groupId: string;
  groupName: string;
  onSave: (option: Partial<AddOnOption>) => Promise<void> | void;
}

export function AddOnOptionModal({
  isOpen,
  onClose,
  option,
  groupId,
  groupName,
  onSave,
}: AddOnOptionModalProps) {
  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Pricing & Duration
  const [priceInput, setPriceInput] = useState('');
  const [duration, setDuration] = useState(15);

  // Status
  const [isActive, setIsActive] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (option) {
        setName(option.name);
        setDescription(option.description || '');
        setPriceInput(option.price > 0 ? option.price.toString() : '');
        setDuration(option.duration);
        setIsActive(option.isActive);
      } else {
        setName('');
        setDescription('');
        setPriceInput('');
        setDuration(15);
        setIsActive(true);
      }
    }
  }, [isOpen, option]);

  // Handle save
  const handleSave = () => {
    if (!name.trim()) return;

    const price = priceInput ? parseFloat(priceInput) : 0;
    onSave({
      groupId,
      name: name.trim(),
      description: description.trim() || undefined,
      price: isNaN(price) ? 0 : price,
      duration,
      isActive,
    });
    onClose();
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
  }, [isOpen, name, priceInput, duration]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {option ? 'Edit Option' : 'New Option'}
              </h2>
              <p className="text-xs text-gray-500">in {groupName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Option Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Deep Conditioning"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this option"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Price & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={priceInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty, digits, and one decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setPriceInput(value);
                    }
                  }}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional Time
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {DURATION_OPTIONS.filter(opt => opt.value <= 60).map((opt) => (
                  <option key={opt.value} value={opt.value}>+{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">Inactive options are hidden from booking</p>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isActive ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isActive ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {option ? 'Save Changes' : 'Add Option'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
