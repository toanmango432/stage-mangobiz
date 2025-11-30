import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  Search,
  Package,
  DollarSign,
  Calendar,
  Globe,
  ChevronDown,
  Check,
  Minus,
} from 'lucide-react';
import type { ServicePackage, MenuService, PackageService, PackageModalProps } from '../types';
import { formatDuration, formatPrice, CATEGORY_COLORS } from '../constants';

export function PackageModal({
  isOpen,
  onClose,
  package: pkg,
  services,
  onSave,
}: PackageModalProps) {
  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#F97316');

  // Services
  const [selectedServices, setSelectedServices] = useState<PackageService[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');

  // Pricing
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Settings
  const [validityDays, setValidityDays] = useState<number | undefined>();
  const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(true);

  // UI State
  const [showServiceSelector, setShowServiceSelector] = useState(false);

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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (pkg) {
        setName(pkg.name);
        setDescription(pkg.description || '');
        setColor(pkg.color || '#F97316');
        setSelectedServices(pkg.services);
        setDiscountType(pkg.discountType);
        setDiscountValue(pkg.discountValue);
        setValidityDays(pkg.validityDays);
        setOnlineBookingEnabled(pkg.onlineBookingEnabled);
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
        setCustomPrice(null);
      }
      setServiceSearch('');
      setShowServiceSelector(false);
    }
  }, [isOpen, pkg]);

  // Filter services for selection
  const filteredServices = useMemo(() => {
    return services
      .filter(s => s.status === 'active')
      .filter(s =>
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.description?.toLowerCase().includes(serviceSearch.toLowerCase())
      );
  }, [services, serviceSearch]);

  // Add service to package
  const addService = (service: MenuService) => {
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

  // Handle save
  const handleSave = () => {
    if (!name.trim() || selectedServices.length === 0) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      services: selectedServices,
      originalPrice,
      packagePrice: Math.round(packagePrice * 100) / 100,
      discountType,
      discountValue,
      validityDays,
      onlineBookingEnabled,
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
  }, [isOpen, showServiceSelector]);

  if (!isOpen) return null;

  const savings = originalPrice - packagePrice;
  const savingsPercent = originalPrice > 0 ? ((savings / originalPrice) * 100).toFixed(0) : 0;

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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
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
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Services <span className="text-red-500">*</span>
              </label>
              <button
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
                  return (
                    <div
                      key={ps.serviceId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{ps.serviceName}</p>
                        <p className="text-xs text-gray-500">
                          {formatDuration(service?.duration || 0)} • {formatPrice(ps.originalPrice)} each
                        </p>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(ps.serviceId, -1)}
                          disabled={ps.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-medium">{ps.quantity}</span>
                        <button
                          onClick={() => updateQuantity(ps.serviceId, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <p className="text-sm font-medium text-gray-900 w-16 text-right">
                        {formatPrice(ps.originalPrice * ps.quantity)}
                      </p>

                      <button
                        onClick={() => removeService(ps.serviceId)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                onClick={() => setShowServiceSelector(true)}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-600 transition-colors"
              >
                <Package size={24} className="mx-auto mb-2 opacity-50" />
                <p>Click to add services to this package</p>
              </button>
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
                      setDiscountType(e.target.value as any);
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
                      max={discountType === 'percentage' ? 100 : originalPrice}
                      value={discountValue}
                      onChange={(e) => {
                        setDiscountValue(Number(e.target.value));
                        setCustomPrice(null);
                      }}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {discountType === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                </div>
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
                min="0"
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-gray-500">
            {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''}
            {selectedServices.length > 0 && ` • ${formatDuration(totalDuration)}`}
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
              disabled={!name.trim() || selectedServices.length === 0}
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
