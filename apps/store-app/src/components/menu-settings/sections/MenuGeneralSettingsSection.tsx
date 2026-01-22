import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  DollarSign,
  Globe,
  Package,
  Zap,
  Settings,
  Info,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { MenuGeneralSettings } from '@/types/catalog';
import { DURATION_OPTIONS, PROCESSING_TIME_OPTIONS } from '../constants';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Validation errors for fields
interface ValidationErrors {
  taxRate?: string;
  depositPercentage?: string;
}

interface MenuGeneralSettingsSectionProps {
  settings?: MenuGeneralSettings;
  onUpdate?: (settings: Partial<MenuGeneralSettings>) => Promise<MenuGeneralSettings | null | void>;
}

// Default settings if none provided
const defaultSettings: MenuGeneralSettings = {
  defaultDuration: 60,
  defaultProcessingTime: 0,
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 0,
  allowCustomPricing: true,
  showPricesOnline: true,
  requireDepositForOnlineBooking: false,
  defaultDepositPercentage: 20,
  enablePackages: true,
  enableAddOns: true,
};

// Debounce timeout in ms
const DEBOUNCE_DELAY = 500;
const SAVED_INDICATOR_DURATION = 2000;

export function MenuGeneralSettingsSection({
  settings = defaultSettings,
  onUpdate,
}: MenuGeneralSettingsSectionProps) {
  // Save status state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Refs for debouncing
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending updates for debounced save
  const pendingUpdatesRef = useRef<Partial<MenuGeneralSettings>>({});

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  // Validation functions
  const validateTaxRate = useCallback((value: number): string | undefined => {
    if (value < 0) return 'Tax rate cannot be negative';
    if (value > 100) return 'Tax rate cannot exceed 100%';
    return undefined;
  }, []);

  const validateDepositPercentage = useCallback((value: number): string | undefined => {
    if (value < 5) return 'Deposit must be at least 5%';
    if (value > 100) return 'Deposit cannot exceed 100%';
    return undefined;
  }, []);

  // Validate all current values
  const currentValidationErrors = useMemo((): ValidationErrors => {
    return {
      taxRate: validateTaxRate(settings.taxRate),
      depositPercentage: validateDepositPercentage(settings.defaultDepositPercentage),
    };
  }, [settings.taxRate, settings.defaultDepositPercentage, validateTaxRate, validateDepositPercentage]);

  // Perform the actual save
  const performSave = useCallback(async (updates: Partial<MenuGeneralSettings>) => {
    if (!onUpdate || Object.keys(updates).length === 0) return;

    // Check for validation errors before saving
    const hasErrors = Object.values(currentValidationErrors).some(error => error !== undefined);
    if (hasErrors) {
      setValidationErrors(currentValidationErrors);
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    try {
      await onUpdate(updates);
      setSaveStatus('saved');

      // Clear saved status after delay
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, SAVED_INDICATOR_DURATION);
    } catch {
      setSaveStatus('error');
    }
  }, [onUpdate, currentValidationErrors]);

  // Debounced update function
  const updateSetting = useCallback(<K extends keyof MenuGeneralSettings>(
    key: K,
    value: MenuGeneralSettings[K]
  ) => {
    // Validate immediately for user feedback
    if (key === 'taxRate') {
      const error = validateTaxRate(value as number);
      setValidationErrors(prev => ({ ...prev, taxRate: error }));
    } else if (key === 'defaultDepositPercentage') {
      const error = validateDepositPercentage(value as number);
      setValidationErrors(prev => ({ ...prev, depositPercentage: error }));
    }

    // Accumulate pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      [key]: value,
    };

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      const updates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      performSave(updates);
    }, DEBOUNCE_DELAY);
  }, [validateTaxRate, validateDepositPercentage, performSave]);

  // Render save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check size={16} />
            <span>Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            <span>Error saving</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Menu Settings</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure default settings for your service menu
            </p>
          </div>
          {renderSaveStatus()}
        </div>

        {/* Service Defaults */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Service Defaults</h3>
              <p className="text-sm text-gray-500">Default duration and processing time for new services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Service Duration
              </label>
              <select
                value={settings.defaultDuration}
                onChange={(e) => updateSetting('defaultDuration', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Applied to new services by default</p>
            </div>

            {/* Default Processing Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Processing Time
              </label>
              <select
                value={settings.defaultProcessingTime}
                onChange={(e) => updateSetting('defaultProcessingTime', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {PROCESSING_TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Buffer time between appointments</p>
            </div>
          </div>
        </div>

        {/* Pricing & Tax */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Pricing & Tax</h3>
              <p className="text-sm text-gray-500">Currency and tax configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => {
                  const symbol = e.target.value === 'USD' ? '$' :
                                 e.target.value === 'EUR' ? '€' :
                                 e.target.value === 'GBP' ? '£' : '$';
                  updateSetting('currency', e.target.value);
                  updateSetting('currencySymbol', symbol);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tax Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.taxRate}
                  onChange={(e) => updateSetting('taxRate', Number(e.target.value))}
                  className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    validationErrors.taxRate
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-200 focus:ring-orange-500'
                  }`}
                  aria-invalid={!!validationErrors.taxRate}
                  aria-describedby={validationErrors.taxRate ? 'tax-rate-error' : undefined}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              {validationErrors.taxRate && (
                <p id="tax-rate-error" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {validationErrors.taxRate}
                </p>
              )}
            </div>

            {/* Custom Pricing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allow Custom Pricing
              </label>
              <button
                onClick={() => updateSetting('allowCustomPricing', !settings.allowCustomPricing)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.allowCustomPricing
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                {settings.allowCustomPricing ? 'Enabled' : 'Disabled'}
              </button>
              <p className="text-xs text-gray-500 mt-1">Allow staff to adjust prices at checkout</p>
            </div>
          </div>
        </div>

        {/* Online Booking */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Globe size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Online Booking</h3>
              <p className="text-sm text-gray-500">Settings for online booking visibility</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Show Prices Online */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Show prices online</p>
                <p className="text-sm text-gray-500">Display service prices on your booking page</p>
              </div>
              <button
                onClick={() => updateSetting('showPricesOnline', !settings.showPricesOnline)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.showPricesOnline ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.showPricesOnline ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Require Deposit */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Require deposit for online bookings</p>
                <p className="text-sm text-gray-500">Collect a deposit when clients book online</p>
              </div>
              <button
                onClick={() => updateSetting('requireDepositForOnlineBooking', !settings.requireDepositForOnlineBooking)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.requireDepositForOnlineBooking ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.requireDepositForOnlineBooking ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Default Deposit */}
            {settings.requireDepositForOnlineBooking && (
              <div className="pl-4 border-l-2 border-orange-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Deposit Percentage
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={settings.defaultDepositPercentage}
                    onChange={(e) => updateSetting('defaultDepositPercentage', Number(e.target.value))}
                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                      validationErrors.depositPercentage
                        ? 'bg-red-200 accent-red-500'
                        : 'bg-gray-200 accent-orange-500'
                    }`}
                    aria-invalid={!!validationErrors.depositPercentage}
                    aria-describedby={validationErrors.depositPercentage ? 'deposit-error' : undefined}
                  />
                  <span className={`text-sm font-medium w-12 text-right ${
                    validationErrors.depositPercentage ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {settings.defaultDepositPercentage}%
                  </span>
                </div>
                {validationErrors.depositPercentage && (
                  <p id="deposit-error" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {validationErrors.depositPercentage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Settings size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Feature Toggles</h3>
              <p className="text-sm text-gray-500">Enable or disable menu features</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enable Packages */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Service Packages</p>
                  <p className="text-xs text-gray-500">Bundle services together</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('enablePackages', !settings.enablePackages)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.enablePackages ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.enablePackages ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Enable Add-ons */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Service Add-ons</p>
                  <p className="text-xs text-gray-500">Quick extras for services</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('enableAddOns', !settings.enableAddOns)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.enableAddOns ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.enableAddOns ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Changes are saved automatically</p>
            <p className="text-sm text-blue-700 mt-1">
              Settings are auto-saved after you stop making changes. Watch the save indicator above for status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
