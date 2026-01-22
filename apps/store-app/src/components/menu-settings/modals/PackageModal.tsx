import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  Search,
  Package,
  Calendar,
  CalendarRange,
  Globe,
  Check,
  Minus,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { z } from 'zod';
import type { PackageServiceItem, PackageModalProps, MenuServiceWithEmbeddedVariants, BundleBookingMode, ServicePackage } from '@/types/catalog';
import { formatDuration, formatPrice, CATEGORY_COLORS, BUNDLE_BOOKING_MODES } from '../constants';

// Zod schema for package form validation
const packageFormSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  discountPercentage: z.number().min(0, 'Discount must be 0% or greater').max(100, 'Discount cannot exceed 100%'),
  discountFixed: z.number().min(0, 'Discount must be $0 or greater'),
  validityDays: z.number().min(1, 'Validity must be at least 1 day').optional(),
});

type PackageFormData = z.infer<typeof packageFormSchema>;
type ValidationErrors = Partial<Record<keyof PackageFormData | 'services' | 'duplicateName' | 'discountExceedsPrice', string>>;

export function PackageModal({
  isOpen,
  onClose,
  package: pkg,
  services,
  allPackages = [],
  onSave,
}: PackageModalProps) {
  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#F97316');

  // Services
  const [selectedServices, setSelectedServices] = useState<PackageServiceItem[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');

  // Pricing
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Settings
  const [validityDays, setValidityDays] = useState<number | undefined>();
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(true);
  const [bookingMode, setBookingMode] = useState<BundleBookingMode>('single-session');

  // UI State
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Calculate totals
  const originalPrice = useMemo(() => {
    return selectedServices.reduce((sum, ps) => sum + ps.originalPrice * ps.quantity, 0);
  }, [selectedServices]);

  const packagePrice = useMemo(() => {
    if (customPrice !== null) return customPrice;
    if (discountType === 'percentage') {
      return originalPrice * (1 - discountValue / 100);
    }
    return originalPrice - discountValue;
  }, [originalPrice, discountType, discountValue, customPrice]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, ps) => {
      const service = services.find(s => s.id === ps.serviceId);
      return sum + (service?.duration || 0) * ps.quantity;
    }, 0);
  }, [selectedServices, services]);

  // Detect orphaned service references (services in package that no longer exist)
  const orphanedServices = useMemo(() => {
    return selectedServices.filter(ps => !services.find(s => s.id === ps.serviceId));
  }, [selectedServices, services]);

  // Check for duplicate package name
  const isDuplicateName = useMemo(() => {
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return false;

    return allPackages.some(p =>
      p.name.toLowerCase() === trimmedName &&
      // Exclude current package when editing
      p.id !== pkg?.id
    );
  }, [name, allPackages, pkg]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // Validate name
    if (!name.trim()) {
      errors.name = 'Package name is required';
    }

    // Check for duplicate name
    if (isDuplicateName) {
      errors.duplicateName = 'A package with this name already exists';
    }

    // Validate services
    if (selectedServices.length === 0) {
      errors.services = 'At least one service is required';
    }

    // Validate discount based on type
    if (discountType === 'percentage') {
      if (discountValue < 0) {
        errors.discountPercentage = 'Discount must be 0% or greater';
      } else if (discountValue > 100) {
        errors.discountPercentage = 'Discount cannot exceed 100%';
      }
    } else {
      if (discountValue < 0) {
        errors.discountFixed = 'Discount must be $0 or greater';
      } else if (discountValue > originalPrice) {
        errors.discountExceedsPrice = 'Fixed discount cannot exceed the original price';
      }
    }

    // Validate validity days if set
    if (validityDays !== undefined && validityDays < 1) {
      errors.validityDays = 'Validity must be at least 1 day';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, isDuplicateName, selectedServices.length, discountType, discountValue, originalPrice, validityDays]);

  // Check if form is valid (for button disabled state)
  const isFormValid = useMemo(() => {
    if (!name.trim()) return false;
    if (selectedServices.length === 0) return false;
    if (isDuplicateName) return false;
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) return false;
    if (discountType === 'fixed' && discountValue > originalPrice) return false;
    return true;
  }, [name, selectedServices.length, isDuplicateName, discountType, discountValue, originalPrice]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (pkg) {
        setName(pkg.name);
        setDescription(pkg.description || '');
        setColor(pkg.color || '#F97316');
        // Filter out orphaned services when loading existing package
        const validServices = pkg.services.filter(ps =>
          services.find(s => s.id === ps.serviceId)
        );
        setSelectedServices(pkg.services); // Keep all services initially to show warning
        setDiscountType(pkg.discountType);
        setDiscountValue(pkg.discountValue);
        setValidityDays(pkg.validityDays);
        setOnlineBookingEnabled(pkg.onlineBookingEnabled);
        setBookingMode(pkg.bookingMode || 'single-session');
        setCustomPrice(null);
      } else {
        setName('');
        setDescription('');
        setColor('#F97316');
        setSelectedServices([]);
        setDiscountType('percentage');
        setDiscountValue(10);
        setValidityDays(undefined);
        setOnlineBookingEnabled(true);
        setBookingMode('single-session');
        setCustomPrice(null);
      }
      setServiceSearch('');
      setShowServiceSelector(false);
      setValidationErrors({});
    }
  }, [isOpen, pkg, services]);

  // Clear validation errors when values change
  useEffect(() => {
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({});
    }
  }, [name, selectedServices.length, discountType, discountValue, validityDays]);

  // Filter services for selection - only show existing active services
  const filteredServices = useMemo(() => {
    return services
      .filter(s => s.status === 'active')
      .filter(s =>
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.description?.toLowerCase().includes(serviceSearch.toLowerCase())
      );
  }, [services, serviceSearch]);

  // Add service to package
  const addService = (service: MenuServiceWithEmbeddedVariants) => {
    const existing = selectedServices.find(ps => ps.serviceId === service.id);
    if (existing) {
      setSelectedServices(prev =>
        prev.map(ps =>
          ps.serviceId === service.id
            ? { ...ps, quantity: ps.quantity + 1 }
            : ps
        )
      );
    } else {
      setSelectedServices(prev => [
        ...prev,
        {
          serviceId: service.id,
          serviceName: service.name,
          quantity: 1,
          originalPrice: service.price,
        }
      ]);
    }
  };

  // Update service quantity
  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedServices(prev =>
      prev.map(ps => {
        if (ps.serviceId !== serviceId) return ps;
        const newQty = Math.max(1, ps.quantity + delta);
        return { ...ps, quantity: newQty };
      })
    );
  };

  // Remove service from package
  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(ps => ps.serviceId !== serviceId));
  };

  // Remove all orphaned services
  const removeOrphanedServices = () => {
    setSelectedServices(prev => prev.filter(ps => services.find(s => s.id === ps.serviceId)));
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) return;

    // Filter out orphaned services before saving
    const validServices = selectedServices.filter(ps =>
      services.find(s => s.id === ps.serviceId)
    );

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      services: validServices,
      originalPrice,
      packagePrice: Math.round(packagePrice * 100) / 100,
      discountType,
      discountValue,
      validityDays,
      onlineBookingEnabled,
      bookingMode,
      bookingAvailability: onlineBookingEnabled ? 'both' : 'in-store',
    });
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (showServiceSelector) {
          setShowServiceSelector(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showServiceSelector, onClose]);

  if (!isOpen) return null;

  const savings = originalPrice - packagePrice;
  const savingsPercent = originalPrice > 0 ? ((savings / originalPrice) * 100).toFixed(0) : 0;

  // Check if discount is valid
  const hasDiscountError = discountType === 'percentage'
    ? (discountValue < 0 || discountValue > 100)
    : (discountValue > originalPrice);

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
            {pkg ? 'Edit Package' : 'New Package'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Package Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bridal Beauty Package"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  (validationErrors.name || validationErrors.duplicateName || isDuplicateName)
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-200'
                }`}
                aria-invalid={!!(validationErrors.name || validationErrors.duplicateName || isDuplicateName)}
                aria-describedby={validationErrors.name || validationErrors.duplicateName || isDuplicateName ? 'name-error' : undefined}
                autoFocus
              />
              {validationErrors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validationErrors.name}
                </p>
              )}
              {(validationErrors.duplicateName || isDuplicateName) && !validationErrors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  A package with this name already exists
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's included in this package"
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.slice(0, 8).map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      color === c.value
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Orphaned Services Warning */}
          {orphanedServices.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-800">Orphaned Services Detected</p>
                  <p className="text-sm text-amber-700 mt-1">
                    {orphanedServices.length} service{orphanedServices.length > 1 ? 's' : ''} in this package no longer exist{orphanedServices.length === 1 ? 's' : ''}:
                  </p>
                  <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
                    {orphanedServices.map(ps => (
                      <li key={ps.serviceId}>{ps.serviceName}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={removeOrphanedServices}
                    className="mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                  >
                    Remove orphaned services
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Services <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowServiceSelector(true)}
                className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
              >
                <Plus size={16} />
                Add Service
              </button>
            </div>

            {selectedServices.length > 0 ? (
              <div className="space-y-2">
                {selectedServices.map((ps) => {
                  const service = services.find(s => s.id === ps.serviceId);
                  const isOrphaned = !service;
                  return (
                    <div
                      key={ps.serviceId}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isOrphaned ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${isOrphaned ? 'text-amber-800' : 'text-gray-900'}`}>
                            {ps.serviceName}
                          </p>
                          {isOrphaned && (
                            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded">
                              Not Found
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isOrphaned ? 'text-amber-600' : 'text-gray-500'}`}>
                          {isOrphaned
                            ? 'This service has been deleted'
                            : `${formatDuration(service?.duration || 0)} • ${formatPrice(ps.originalPrice)} each`
                          }
                        </p>
                      </div>

                      {/* Quantity */}
                      {!isOrphaned && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(ps.serviceId, -1)}
                            disabled={ps.quantity <= 1}
                            className="w-7 h-7 flex items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center font-medium">{ps.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(ps.serviceId, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}

                      {/* Subtotal */}
                      {!isOrphaned && (
                        <p className="text-sm font-medium text-gray-900 w-16 text-right">
                          {formatPrice(ps.originalPrice * ps.quantity)}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => removeService(ps.serviceId)}
                        className={`p-1.5 rounded ${
                          isOrphaned
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100'
                            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowServiceSelector(true)}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-600 transition-colors"
              >
                <Package size={24} className="mx-auto mb-2 opacity-50" />
                <p>Click to add services to this package</p>
              </button>
            )}
            {validationErrors.services && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                {validationErrors.services}
              </p>
            )}
          </div>

          {/* Pricing */}
          {selectedServices.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Original Total</span>
                <span className="font-medium text-gray-900">{formatPrice(originalPrice)}</span>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount
                </label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => {
                      setDiscountType(e.target.value as 'fixed' | 'percentage');
                      setCustomPrice(null);
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'percentage' ? 100 : undefined}
                      value={discountValue}
                      onChange={(e) => {
                        setDiscountValue(Number(e.target.value));
                        setCustomPrice(null);
                      }}
                      className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                        hasDiscountError
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-orange-500'
                      }`}
                      aria-invalid={hasDiscountError}
                      aria-describedby={hasDiscountError ? 'discount-error' : undefined}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {discountType === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                </div>
                {discountType === 'percentage' && discountValue > 100 && (
                  <p id="discount-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Discount cannot exceed 100%
                  </p>
                )}
                {discountType === 'fixed' && discountValue > originalPrice && (
                  <p id="discount-error" className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Fixed discount cannot exceed the original price ({formatPrice(originalPrice)})
                  </p>
                )}
              </div>

              {/* Or Custom Price */}
              <div className="text-center">
                <span className="text-xs text-gray-500">- or -</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Custom Package Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={customPrice ?? ''}
                    onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : null)}
                    placeholder={packagePrice.toFixed(2)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Package Price</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(packagePrice)}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
                      Save {savingsPercent}% ({formatPrice(savings)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-4">
            {/* Booking Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                {BUNDLE_BOOKING_MODES.map((mode) => {
                  const Icon = mode.value === 'single-session' ? Calendar : CalendarRange;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setBookingMode(mode.value as BundleBookingMode)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        bookingMode === mode.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={18} className={bookingMode === mode.value ? 'text-orange-600' : 'text-gray-600'} />
                        <span className={`font-medium ${bookingMode === mode.value ? 'text-orange-700' : 'text-gray-900'}`}>
                          {mode.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{mode.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Validity Period</p>
                  <p className="text-sm text-gray-500">Days after purchase to use package</p>
                </div>
              </div>
              <input
                type="number"
                min="1"
                value={validityDays || ''}
                onChange={(e) => setValidityDays(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="No limit"
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-right"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Online Booking</p>
                  <p className="text-sm text-gray-500">Allow clients to book online</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOnlineBookingEnabled(!onlineBookingEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  onlineBookingEnabled ? 'bg-orange-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={onlineBookingEnabled}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    onlineBookingEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-gray-500">
            {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}
            {selectedServices.length > 0 && ` • ${formatDuration(totalDuration)}`}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isFormValid}
              className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pkg ? 'Save Changes' : 'Create Package'}
            </button>
          </div>
        </div>

        {/* Service Selector Modal */}
        {showServiceSelector && (
          <div
            className="absolute inset-0 bg-black/20 flex items-center justify-center p-4"
            onClick={() => setShowServiceSelector(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Search services..."
                  className="flex-1 text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowServiceSelector(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {filteredServices.map((service) => {
                  const isSelected = selectedServices.some(ps => ps.serviceId === service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => addService(service)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDuration(service.duration)} • {formatPrice(service.price)}
                        </p>
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                      )}
                    </button>
                  );
                })}

                {filteredServices.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No services found</p>
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowServiceSelector(false)}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
                >
                  Done ({selectedServices.length} selected)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
