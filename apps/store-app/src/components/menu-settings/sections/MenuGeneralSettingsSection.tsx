import { useCallback } from 'react';
import {
  Clock,
  DollarSign,
  Globe,
  Package,
  Zap,
  Settings,
  Info,
} from 'lucide-react';
import type { MenuGeneralSettings } from '@/types/catalog';
import { DURATION_OPTIONS, PROCESSING_TIME_OPTIONS } from '../constants';

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

export function MenuGeneralSettingsSection({
  settings = defaultSettings,
  onUpdate,
}: MenuGeneralSettingsSectionProps) {
  const updateSetting = useCallback(<K extends keyof MenuGeneralSettings>(
    key: K,
    value: MenuGeneralSettings[K]
  ) => {
    if (onUpdate) {
      onUpdate({ [key]: value });
    }
  }, [onUpdate]);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Menu Settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure default settings for your service menu
          </p>
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
                  className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
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
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {settings.defaultDepositPercentage}%
                  </span>
                </div>
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
              All settings changes are applied immediately across your booking system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
