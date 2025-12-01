import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Globe,
  Check,
  Link,
  Layers,
  Info,
} from 'lucide-react';
import type { AddOnGroup, CategoryWithCount, MenuService } from '../../../types/catalog';
import {
  ADDON_SELECTION_MODES,
  ADDON_MIN_SELECTION_OPTIONS,
  ADDON_MAX_SELECTION_OPTIONS,
} from '../constants';

interface AddOnGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: AddOnGroup;
  categories: CategoryWithCount[];
  services?: MenuService[]; // Optional for future service-level applicability
  onSave: (group: Partial<AddOnGroup>) => Promise<void> | void;
}

export function AddOnGroupModal({
  isOpen,
  onClose,
  group,
  categories,
  // services prop reserved for future service-level applicability
  onSave,
}: AddOnGroupModalProps) {
  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Selection Rules
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('single');
  const [minSelections, setMinSelections] = useState(0);
  const [maxSelections, setMaxSelections] = useState<number | undefined>(undefined);
  const [isRequired, setIsRequired] = useState(false);

  // Applicability
  const [applicableToAll, setApplicableToAll] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Online Booking
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (group) {
        setName(group.name);
        setDescription(group.description || '');
        setSelectionMode(group.selectionMode);
        setMinSelections(group.minSelections);
        setMaxSelections(group.maxSelections);
        setIsRequired(group.isRequired);
        setApplicableToAll(group.applicableToAll);
        setSelectedCategoryIds(group.applicableCategoryIds);
        setSelectedServiceIds(group.applicableServiceIds);
        setOnlineBookingEnabled(group.onlineBookingEnabled);
      } else {
        setName('');
        setDescription('');
        setSelectionMode('single');
        setMinSelections(0);
        setMaxSelections(undefined);
        setIsRequired(false);
        setApplicableToAll(true);
        setSelectedCategoryIds([]);
        setSelectedServiceIds([]);
        setOnlineBookingEnabled(true);
      }
    }
  }, [isOpen, group]);

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Toggle service selection (reserved for future service-level applicability)
  // const toggleService = (serviceId: string) => {
  //   setSelectedServiceIds(prev =>
  //     prev.includes(serviceId)
  //       ? prev.filter(id => id !== serviceId)
  //       : [...prev, serviceId]
  //   );
  // };

  // Handle save
  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      selectionMode,
      minSelections,
      maxSelections,
      isRequired,
      applicableToAll,
      applicableCategoryIds: applicableToAll ? [] : selectedCategoryIds,
      applicableServiceIds: applicableToAll ? [] : selectedServiceIds,
      onlineBookingEnabled,
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
  }, [isOpen, name]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Layers size={20} className="text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {group ? 'Edit Add-on Group' : 'New Add-on Group'}
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
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Hair Treatments"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>

          {/* Description / Client Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Client Prompt
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Would you like to add a treatment?"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This text is shown to clients during booking
            </p>
          </div>

          {/* Selection Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selection Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ADDON_SELECTION_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setSelectionMode(mode.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectionMode === mode.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">{mode.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Selection Limits (for multiple selection mode) */}
          {selectionMode === 'multiple' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Minimum Selections
                </label>
                <select
                  value={minSelections}
                  onChange={(e) => setMinSelections(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {ADDON_MIN_SELECTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Maximum Selections
                </label>
                <select
                  value={maxSelections ?? ''}
                  onChange={(e) => setMaxSelections(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {ADDON_MAX_SELECTION_OPTIONS.map((opt) => (
                    <option key={opt.value ?? 'unlimited'} value={opt.value ?? ''}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Required Selection</p>
                <p className="text-xs text-gray-500">Client must choose at least one option</p>
              </div>
            </div>
            <button
              onClick={() => setIsRequired(!isRequired)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isRequired ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isRequired ? 'left-7' : 'left-1'
                }`}
              />
            </button>
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
                  applicableToAll ? 'bg-purple-500' : 'bg-gray-300'
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
                  Select categories or specific services:
                </p>

                {/* Categories */}
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mt-3 mb-2">
                  Categories
                </p>
                {categories.filter(c => c.isActive).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedCategoryIds.includes(category.id)
                        ? 'border-purple-500 bg-purple-50'
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
                          ? 'bg-purple-500'
                          : 'border-2 border-gray-300'
                      }`}
                    >
                      {selectedCategoryIds.includes(category.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                  </button>
                ))}

                {selectedCategoryIds.length === 0 && selectedServiceIds.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">
                    Please select at least one category or service
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
                <p className="text-xs text-gray-500">Show this group during online booking</p>
              </div>
            </div>
            <button
              onClick={() => setOnlineBookingEnabled(!onlineBookingEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                onlineBookingEnabled ? 'bg-purple-500' : 'bg-gray-300'
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
            disabled={!name.trim() || (!applicableToAll && selectedCategoryIds.length === 0 && selectedServiceIds.length === 0)}
            className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {group ? 'Save Changes' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
