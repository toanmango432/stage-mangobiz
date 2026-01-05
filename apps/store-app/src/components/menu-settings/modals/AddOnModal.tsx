import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Globe,
  Check,
  Link,
  Zap,
} from 'lucide-react';
import type { AddOnModalProps } from '@/types/catalog';
import { DURATION_OPTIONS } from '../constants';

export function AddOnModal({
  isOpen,
  onClose,
  addOn,
  categories,
  onSave,
}: AddOnModalProps) {
  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Pricing
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(15);

  // Applicability
  const [applicableToAll, setApplicableToAll] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Online Booking
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (addOn) {
        setName(addOn.name);
        setDescription(addOn.description || '');
        setPrice(addOn.price);
        setDuration(addOn.duration);
        setApplicableToAll(addOn.applicableToAll);
        setSelectedCategoryIds(addOn.applicableCategoryIds);
        setOnlineBookingEnabled(addOn.onlineBookingEnabled);
      } else {
        setName('');
        setDescription('');
        setPrice(0);
        setDuration(15);
        setApplicableToAll(true);
        setSelectedCategoryIds([]);
        setOnlineBookingEnabled(true);
      }
    }
  }, [isOpen, addOn]);

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle save
  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      price,
      duration,
      applicableToAll,
      applicableCategoryIds: applicableToAll ? [] : selectedCategoryIds,
      applicableServiceIds: [],
      onlineBookingEnabled,
    });
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
  }, [isOpen, name, price, duration]);

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
            <h2 className="text-lg font-semibold text-gray-900">
              {addOn ? 'Edit Add-on' : 'New Add-on'}
            </h2>
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
              Add-on Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Scalp Massage"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              placeholder="Brief description of this add-on"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
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
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {DURATION_OPTIONS.filter(opt => opt.value <= 60).map((opt) => (
                  <option key={opt.value} value={opt.value}>+{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Applicability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Applies To
            </label>

            {/* All Services Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
              <div className="flex items-center gap-2">
                <Link size={18} className="text-gray-500" />
                <span className="font-medium text-gray-900">All Services</span>
              </div>
              <button
                onClick={() => setApplicableToAll(!applicableToAll)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  applicableToAll ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    applicableToAll ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Category Selection */}
            {!applicableToAll && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">
                  Select which categories this add-on applies to:
                </p>
                {categories.filter(c => c.isActive).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedCategoryIds.includes(category.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <span className="flex-1 text-left font-medium text-gray-900">
                      {category.name}
                    </span>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center ${
                        selectedCategoryIds.includes(category.id)
                          ? 'bg-orange-500'
                          : 'border-2 border-gray-300'
                      }`}
                    >
                      {selectedCategoryIds.includes(category.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                  </button>
                ))}

                {selectedCategoryIds.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    Please select at least one category
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Online Booking */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Online Booking</p>
                <p className="text-xs text-gray-500">Show as option when booking online</p>
              </div>
            </div>
            <button
              onClick={() => setOnlineBookingEnabled(!onlineBookingEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                onlineBookingEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  onlineBookingEnabled ? 'left-7' : 'left-1'
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
            disabled={!name.trim() || (!applicableToAll && selectedCategoryIds.length === 0)}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addOn ? 'Save Changes' : 'Create Add-on'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
