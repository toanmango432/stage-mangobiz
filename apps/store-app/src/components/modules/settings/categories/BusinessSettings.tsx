/**
 * Business Settings Category
 * Profile, Contact, Address, Locale, Operating Hours, Tax
 */

import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Building2, Phone, MapPin, Globe, Clock, Receipt, Search, ChevronDown, Check } from 'lucide-react';
import type { AppDispatch } from '@/store';
import { setStoreTimezone } from '@/utils/dateUtils';
import {
  selectBusinessSettings,
  updateBusinessProfile,
  updateBusinessContact,
  updateBusinessAddress,
  updateBusinessLocale,
  updateOperatingHours,
  updateTaxSettings,
} from '@/store/slices/settingsSlice';
import type { BusinessType, DateFormat, TimeFormat, OperatingHours, DayHours } from '@/types/settings';

// Section Card Component
function SettingsSection({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <span className="text-amber-600">{icon}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Form Field Component
function FormField({ 
  label, 
  children, 
  required = false,
  hint 
}: { 
  label: string; 
  children: React.ReactNode; 
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// Input Component
function Input({ 
  value, 
  onChange, 
  placeholder,
  type = 'text',
  ...props 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
      {...props}
    />
  );
}

// Select Component
function Select<T extends string>({ 
  value, 
  onChange, 
  options 
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Searchable Select Component
function SearchableSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Search...',
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current selected label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label || value || placeholder;

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.value.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-white text-left flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-amber-50 ${
                    option.value === value ? 'bg-amber-50 text-amber-700' : 'text-gray-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.value === value && <Check className="w-4 h-4 text-amber-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Toggle Component
function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-amber-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

// Business Type Options
const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'med_spa', label: 'Med Spa' },
  { value: 'other', label: 'Other' },
];

const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const TIME_FORMATS: { value: TimeFormat; label: string }[] = [
  { value: '12h', label: '12-hour (AM/PM)' },
  { value: '24h', label: '24-hour' },
];

// Common US and international timezones
const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  // US Timezones
  { value: 'America/New_York', label: 'Eastern Time (ET) - New York' },
  { value: 'America/Chicago', label: 'Central Time (CT) - Chicago' },
  { value: 'America/Denver', label: 'Mountain Time (MT) - Denver' },
  { value: 'America/Phoenix', label: 'Arizona Time - Phoenix (No DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' },
  { value: 'America/Anchorage', label: 'Alaska Time - Anchorage' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time - Honolulu (No DST)' },
  // Canada
  { value: 'America/Toronto', label: 'Eastern Time - Toronto' },
  { value: 'America/Vancouver', label: 'Pacific Time - Vancouver' },
  // International
  { value: 'Europe/London', label: 'GMT/BST - London' },
  { value: 'Europe/Paris', label: 'CET - Paris' },
  { value: 'Europe/Berlin', label: 'CET - Berlin' },
  { value: 'Asia/Tokyo', label: 'JST - Tokyo' },
  { value: 'Asia/Shanghai', label: 'CST - Shanghai' },
  { value: 'Asia/Singapore', label: 'SGT - Singapore' },
  { value: 'Australia/Sydney', label: 'AEST - Sydney' },
  { value: 'Australia/Melbourne', label: 'AEST - Melbourne' },
];

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function BusinessSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const business = useSelector(selectBusinessSettings);

  if (!business) {
    return <div className="text-gray-500">Loading business settings...</div>;
  }

  const { profile, contact, address, locale, operatingHours, tax } = business;

  // Update handlers
  const handleProfileChange = (field: string, value: string) => {
    dispatch(updateBusinessProfile({ [field]: value }));
  };

  const handleContactChange = (field: string, value: string) => {
    dispatch(updateBusinessContact({ [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    dispatch(updateBusinessAddress({ [field]: value }));
  };

  const handleLocaleChange = (field: string, value: string) => {
    dispatch(updateBusinessLocale({ [field]: value }));

    // Sync timezone with dateUtils for proper date/time handling
    if (field === 'timezone') {
      setStoreTimezone(value);
    }
  };

  const handleHoursChange = (day: keyof OperatingHours, field: keyof DayHours, value: string | boolean) => {
    const updatedHours = {
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [field]: value,
      },
    };
    dispatch(updateOperatingHours(updatedHours));
  };

  const handleTaxChange = (field: string, value: string | number | boolean) => {
    dispatch(updateTaxSettings({ [field]: value }));
  };

  return (
    <div>
      {/* Profile Section */}
      <SettingsSection title="Business Profile" icon={<Building2 className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Business Name" required>
            <Input
              value={profile.name}
              onChange={(v) => handleProfileChange('name', v)}
              placeholder="Your Salon Name"
            />
          </FormField>
          <FormField label="Legal Name" required>
            <Input
              value={profile.legalName}
              onChange={(v) => handleProfileChange('legalName', v)}
              placeholder="Legal Business Name"
            />
          </FormField>
        </div>
        <FormField label="Business Type" required>
          <Select
            value={profile.type}
            onChange={(v) => handleProfileChange('type', v)}
            options={BUSINESS_TYPES}
          />
        </FormField>
        <FormField label="Description" hint="Brief description for your clients">
          <textarea
            value={profile.description || ''}
            onChange={(e) => handleProfileChange('description', e.target.value)}
            placeholder="Tell clients about your business..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            rows={3}
          />
        </FormField>
      </SettingsSection>

      {/* Contact Section */}
      <SettingsSection title="Contact Information" icon={<Phone className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone Number" required>
            <Input
              value={contact.phone}
              onChange={(v) => handleContactChange('phone', v)}
              placeholder="(555) 123-4567"
              type="tel"
            />
          </FormField>
          <FormField label="Email" required>
            <Input
              value={contact.email}
              onChange={(v) => handleContactChange('email', v)}
              placeholder="hello@yoursalon.com"
              type="email"
            />
          </FormField>
        </div>
        <FormField label="Website">
          <Input
            value={contact.website || ''}
            onChange={(v) => handleContactChange('website', v)}
            placeholder="https://yoursalon.com"
            type="url"
          />
        </FormField>
      </SettingsSection>

      {/* Address Section */}
      <SettingsSection title="Address" icon={<MapPin className="w-5 h-5" />}>
        <FormField label="Street Address" required>
          <Input
            value={address.street}
            onChange={(v) => handleAddressChange('street', v)}
            placeholder="123 Main Street"
          />
        </FormField>
        <FormField label="Suite/Unit">
          <Input
            value={address.suite || ''}
            onChange={(v) => handleAddressChange('suite', v)}
            placeholder="Suite 100"
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="City" required>
            <Input
              value={address.city}
              onChange={(v) => handleAddressChange('city', v)}
              placeholder="City"
            />
          </FormField>
          <FormField label="State/Province" required>
            <Input
              value={address.state}
              onChange={(v) => handleAddressChange('state', v)}
              placeholder="State"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Postal Code" required>
            <Input
              value={address.postalCode}
              onChange={(v) => handleAddressChange('postalCode', v)}
              placeholder="12345"
            />
          </FormField>
          <FormField label="Country" required>
            <Input
              value={address.country}
              onChange={(v) => handleAddressChange('country', v)}
              placeholder="United States"
            />
          </FormField>
        </div>
      </SettingsSection>

      {/* Locale Section */}
      <SettingsSection title="Locale & Format" icon={<Globe className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Timezone" hint="Used for appointment scheduling and display">
            <SearchableSelect
              value={locale.timezone}
              onChange={(v) => handleLocaleChange('timezone', v)}
              options={TIMEZONE_OPTIONS}
              placeholder="Search timezone..."
            />
          </FormField>
          <FormField label="Currency">
            <Select
              value={locale.currency}
              onChange={(v) => handleLocaleChange('currency', v)}
              options={CURRENCY_OPTIONS}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date Format">
            <Select
              value={locale.dateFormat}
              onChange={(v) => handleLocaleChange('dateFormat', v)}
              options={DATE_FORMATS}
            />
          </FormField>
          <FormField label="Time Format">
            <Select
              value={locale.timeFormat}
              onChange={(v) => handleLocaleChange('timeFormat', v)}
              options={TIME_FORMATS}
            />
          </FormField>
        </div>
      </SettingsSection>

      {/* Operating Hours Section */}
      <SettingsSection title="Operating Hours" icon={<Clock className="w-5 h-5" />}>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const dayHours = operatingHours[day];
            return (
              <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                <div className="w-28">
                  <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                </div>
                <Toggle
                  checked={dayHours.isOpen}
                  onChange={(checked) => handleHoursChange(day, 'isOpen', checked)}
                />
                {dayHours.isOpen && (
                  <>
                    <input
                      type="time"
                      value={dayHours.openTime || '09:00'}
                      onChange={(e) => handleHoursChange(day, 'openTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={dayHours.closeTime || '17:00'}
                      onChange={(e) => handleHoursChange(day, 'closeTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </>
                )}
                {!dayHours.isOpen && (
                  <span className="text-sm text-gray-400">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Tax Section */}
      <SettingsSection title="Tax Settings" icon={<Receipt className="w-5 h-5" />}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-900">Enable Tax</p>
            <p className="text-sm text-gray-500">Calculate tax on transactions</p>
          </div>
          <Toggle
            checked={tax.enabled}
            onChange={(checked) => handleTaxChange('enabled', checked)}
          />
        </div>
        
        {tax.enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tax Rate (%)">
                <Input
                  value={tax.rate.toString()}
                  onChange={(v) => handleTaxChange('rate', parseFloat(v) || 0)}
                  placeholder="8.25"
                  type="number"
                />
              </FormField>
              <FormField label="Tax Name">
                <Input
                  value={tax.name}
                  onChange={(v) => handleTaxChange('name', v)}
                  placeholder="Sales Tax"
                />
              </FormField>
            </div>
            <FormField label="Tax ID" hint="Your business tax identification number">
              <Input
                value={tax.taxId || ''}
                onChange={(v) => handleTaxChange('taxId', v)}
                placeholder="XX-XXXXXXX"
              />
            </FormField>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="font-medium text-gray-900">Tax Inclusive Pricing</p>
                <p className="text-sm text-gray-500">Prices already include tax</p>
              </div>
              <Toggle
                checked={tax.inclusive}
                onChange={(checked) => handleTaxChange('inclusive', checked)}
              />
            </div>
          </>
        )}
      </SettingsSection>
    </div>
  );
}

export default BusinessSettings;
