import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Globe,
  Users,
  Info,
  GripVertical,
  Star,
} from 'lucide-react';
import type { EmbeddedVariant, ServiceModalProps } from '../../../types/catalog';
import { DURATION_OPTIONS, PROCESSING_TIME_OPTIONS, formatDuration } from '../constants';

export function ServiceModal({
  isOpen,
  onClose,
  service,
  categories,
  onSave,
}: ServiceModalProps) {
  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Pricing
  const [pricingType, setPricingType] = useState<'fixed' | 'from' | 'varies' | 'free'>('fixed');
  const [price, setPrice] = useState(0);

  // Duration
  const [duration, setDuration] = useState(60);
  const [extraTime, setExtraTime] = useState(0);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<EmbeddedVariant[]>([]);

  // Staff
  const [allStaffCanPerform, setAllStaffCanPerform] = useState(true);

  // Online Booking
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(true);
  const [showPriceOnline, setShowPriceOnline] = useState(true);
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState(20);

  // Other
  const [taxable, setTaxable] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'booking' | 'advanced'>('basic');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (service) {
        setName(service.name);
        setDescription(service.description || '');
        setCategoryId(service.categoryId);
        setPricingType(service.pricingType as any);
        setPrice(service.price);
        setDuration(service.duration);
        setExtraTime(service.extraTime || 0);
        setHasVariants(service.hasVariants || false);
        setVariants(service.variants || []);
        setAllStaffCanPerform(service.allStaffCanPerform);
        setOnlineBookingEnabled(service.onlineBookingEnabled);
        setShowPriceOnline(service.showPriceOnline);
        setRequiresDeposit(service.requiresDeposit);
        setDepositPercentage(service.depositPercentage || 20);
        setTaxable(service.taxable);
      } else {
        setName('');
        setDescription('');
        setCategoryId(categories[0]?.id || '');
        setPricingType('fixed');
        setPrice(0);
        setDuration(60);
        setExtraTime(0);
        setHasVariants(false);
        setVariants([]);
        setAllStaffCanPerform(true);
        setOnlineBookingEnabled(true);
        setShowPriceOnline(true);
        setRequiresDeposit(false);
        setDepositPercentage(20);
        setTaxable(true);
      }
      setActiveTab('basic');
    }
  }, [isOpen, service, categories]);

  // Add variant
  const addVariant = () => {
    const newVariant: EmbeddedVariant = {
      id: `var-${Date.now()}`,
      name: '',
      duration: duration,
      price: price,
      processingTime: extraTime,
      isDefault: variants.length === 0,
    };
    setVariants([...variants, newVariant]);
  };

  // Update variant
  const updateVariant = (index: number, updates: Partial<EmbeddedVariant>) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], ...updates };
    setVariants(newVariants);
  };

  // Remove variant
  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    // Ensure at least one is default
    if (newVariants.length > 0 && !newVariants.some(v => v.isDefault)) {
      newVariants[0].isDefault = true;
    }
    setVariants(newVariants);
  };

  // Set default variant
  const setDefaultVariant = (index: number) => {
    const newVariants = variants.map((v, i) => ({
      ...v,
      isDefault: i === index
    }));
    setVariants(newVariants);
  };

  // Handle save
  const handleSave = () => {
    if (!name.trim() || !categoryId) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId,
      pricingType,
      price,
      duration,
      extraTime: extraTime || undefined,
      hasVariants,
      allStaffCanPerform,
      onlineBookingEnabled,
      showPriceOnline,
      requiresDeposit,
      depositPercentage: requiresDeposit ? depositPercentage : undefined,
      taxable,
      bookingAvailability: onlineBookingEnabled ? 'both' : 'in-store',
    }, hasVariants ? variants : undefined);
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing & Duration' },
    { id: 'booking', label: 'Online Booking' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {service ? 'Edit Service' : 'New Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-1 border-b border-gray-100 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Women's Haircut"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what's included in this service"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Pricing & Duration Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              {/* Pricing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'fixed', label: 'Fixed' },
                    { id: 'from', label: 'From' },
                    { id: 'varies', label: 'Varies' },
                    { id: 'free', label: 'Free' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPricingType(type.id as any)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pricingType === type.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              {pricingType !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {pricingType === 'from' ? 'Starting Price' : 'Price'}
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
              )}

              {/* Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Extra Time
                  </label>
                  <select
                    value={extraTime}
                    onChange={(e) => setExtraTime(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {PROCESSING_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Variants Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Service Variants</p>
                  <p className="text-sm text-gray-500">Add different options like "Short Hair", "Long Hair"</p>
                </div>
                <button
                  onClick={() => setHasVariants(!hasVariants)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    hasVariants ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      hasVariants ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Variants List */}
              {hasVariants && (
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <GripVertical size={16} className="text-gray-400 cursor-grab" />

                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, { name: e.target.value })}
                        placeholder="Variant name"
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />

                      <select
                        value={variant.duration}
                        onChange={(e) => updateVariant(index, { duration: Number(e.target.value) })}
                        className="w-28 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>

                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, { price: Number(e.target.value) })}
                          className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <button
                        onClick={() => setDefaultVariant(index)}
                        className={`p-1.5 rounded ${
                          variant.isDefault
                            ? 'bg-orange-100 text-orange-600'
                            : 'text-gray-400 hover:bg-gray-200'
                        }`}
                        title={variant.isDefault ? 'Default' : 'Set as default'}
                      >
                        <Star size={16} fill={variant.isDefault ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={() => removeVariant(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addVariant}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors"
                  >
                    <Plus size={18} />
                    Add Variant
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Online Booking Tab */}
          {activeTab === 'booking' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Online Booking</p>
                    <p className="text-sm text-gray-500">Allow clients to book this service online</p>
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

              {onlineBookingEnabled && (
                <>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <DollarSign size={20} className="text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Show Price Online</p>
                        <p className="text-sm text-gray-500">Display price on booking page</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPriceOnline(!showPriceOnline)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        showPriceOnline ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          showPriceOnline ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Require Deposit</p>
                      <p className="text-sm text-gray-500">Collect deposit for online bookings</p>
                    </div>
                    <button
                      onClick={() => setRequiresDeposit(!requiresDeposit)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        requiresDeposit ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          requiresDeposit ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {requiresDeposit && (
                    <div className="pl-4 border-l-2 border-orange-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Percentage
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={depositPercentage}
                          onChange={(e) => setDepositPercentage(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {depositPercentage}%
                        </span>
                      </div>
                      {pricingType !== 'free' && (
                        <p className="text-xs text-gray-500 mt-2">
                          Deposit amount: ${(price * depositPercentage / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">All Staff Can Perform</p>
                    <p className="text-sm text-gray-500">Any team member can provide this service</p>
                  </div>
                </div>
                <button
                  onClick={() => setAllStaffCanPerform(!allStaffCanPerform)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    allStaffCanPerform ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      allStaffCanPerform ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Taxable</p>
                  <p className="text-sm text-gray-500">Apply tax to this service</p>
                </div>
                <button
                  onClick={() => setTaxable(!taxable)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    taxable ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      taxable ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {!allStaffCanPerform && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Staff permissions can be configured in the Staff Permissions tab after saving this service.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-gray-500">
            {hasVariants && variants.length > 0
              ? `${variants.length} variant${variants.length > 1 ? 's' : ''}`
              : formatDuration(duration)}
            {pricingType !== 'free' && ` • ${pricingType === 'from' ? 'From ' : ''}$${price}`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !categoryId}
              className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {service ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
