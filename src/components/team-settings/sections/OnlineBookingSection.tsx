import React, { useState } from 'react';
import type { OnlineBookingSettings, BookingBufferType } from '../types';
import { Card, SectionHeader, Toggle, Button, Badge, Input, Textarea } from '../components/SharedComponents';

interface OnlineBookingSectionProps {
  settings: OnlineBookingSettings;
  onChange: (settings: OnlineBookingSettings) => void;
  memberName: string;
}

export const OnlineBookingSection: React.FC<OnlineBookingSectionProps> = ({
  settings,
  onChange,
  memberName,
}) => {
  const [newSpecialty, setNewSpecialty] = useState('');

  const bufferTypeOptions = [
    { value: 'before', label: 'Before Appointment' },
    { value: 'after', label: 'After Appointment' },
    { value: 'both', label: 'Before & After' },
  ];

  const addSpecialty = () => {
    if (newSpecialty.trim() && !settings.specialties?.includes(newSpecialty.trim())) {
      onChange({
        ...settings,
        specialties: [...(settings.specialties || []), newSpecialty.trim()],
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    onChange({
      ...settings,
      specialties: settings.specialties?.filter((s) => s !== specialty),
    });
  };

  return (
    <div className="space-y-6">
      {/* Online Status Overview */}
      <Card padding="lg" className={settings.isBookableOnline ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${settings.isBookableOnline ? 'bg-emerald-100' : 'bg-gray-200'}`}>
              <GlobeIcon className={`w-8 h-8 ${settings.isBookableOnline ? 'text-emerald-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Online Booking</h3>
              <p className={`text-sm ${settings.isBookableOnline ? 'text-emerald-600' : 'text-gray-500'}`}>
                {settings.isBookableOnline ? 'Accepting online bookings' : 'Not available for online booking'}
              </p>
            </div>
          </div>
          <Toggle
            enabled={settings.isBookableOnline}
            onChange={(enabled) => onChange({ ...settings, isBookableOnline: enabled })}
            size="lg"
          />
        </div>
      </Card>

      {/* Visibility Settings */}
      <Card padding="lg">
        <SectionHeader
          title="Visibility"
          subtitle="Where this team member appears"
          icon={<EyeIcon className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={settings.showOnWebsite}
              onChange={(enabled) => onChange({ ...settings, showOnWebsite: enabled })}
              label="Show on Website"
              description="Display on your booking website"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={settings.showOnApp}
              onChange={(enabled) => onChange({ ...settings, showOnApp: enabled })}
              label="Show on App"
              description="Display on mobile booking app"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={settings.acceptNewClients}
              onChange={(enabled) => onChange({ ...settings, acceptNewClients: enabled })}
              label="Accept New Clients"
              description="Allow first-time clients to book"
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Toggle
              enabled={settings.autoAcceptBookings}
              onChange={(enabled) => onChange({ ...settings, autoAcceptBookings: enabled })}
              label="Auto-Accept Bookings"
              description="Automatically confirm new bookings"
            />
          </div>
        </div>
      </Card>

      {/* Booking Rules */}
      <Card padding="lg">
        <SectionHeader
          title="Booking Rules"
          subtitle="Control how clients can book"
          icon={<CalendarIcon className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Advance Booking
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.maxAdvanceBookingDays}
                onChange={(e) => onChange({ ...settings, maxAdvanceBookingDays: Number(e.target.value) })}
                className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-gray-500">days in advance</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">How far ahead clients can book</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Advance Notice
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.minAdvanceBookingHours}
                onChange={(e) => onChange({ ...settings, minAdvanceBookingHours: Number(e.target.value) })}
                className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-gray-500">hours minimum</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Minimum notice required for bookings</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buffer Between Appointments
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.bufferBetweenAppointments}
                onChange={(e) => onChange({ ...settings, bufferBetweenAppointments: Number(e.target.value) })}
                className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-gray-500">minutes</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buffer Position
            </label>
            <select
              value={settings.bufferType}
              onChange={(e) => onChange({ ...settings, bufferType: e.target.value as BookingBufferType })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {bufferTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Toggle
                enabled={settings.allowDoubleBooking}
                onChange={(enabled) => onChange({ ...settings, allowDoubleBooking: enabled })}
                label="Allow Double Booking"
                description="Allow overlapping appointments"
              />
            </div>
            {settings.allowDoubleBooking && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Concurrent Appointments
                </label>
                <input
                  type="number"
                  value={settings.maxConcurrentAppointments}
                  onChange={(e) => onChange({ ...settings, maxConcurrentAppointments: Number(e.target.value) })}
                  min="1"
                  max="10"
                  className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Deposit Settings */}
      <Card padding="lg">
        <SectionHeader
          title="Deposit Requirements"
          subtitle="Require payment upfront to secure bookings"
          icon={<CreditCardIcon className="w-5 h-5" />}
        />

        <div className="p-4 bg-gray-50 rounded-xl mb-4">
          <Toggle
            enabled={settings.requireDeposit}
            onChange={(enabled) => onChange({ ...settings, requireDeposit: enabled })}
            label="Require Deposit"
            description="Clients must pay a deposit when booking"
          />
        </div>

        {settings.requireDeposit && (
          <div className="p-4 border border-gray-200 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">$</span>
              <input
                type="number"
                value={settings.depositAmount || ''}
                onChange={(e) => onChange({ ...settings, depositAmount: Number(e.target.value) })}
                placeholder="25"
                className="w-32 px-3 py-2 text-lg font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This amount will be collected when clients book online
            </p>
          </div>
        )}
      </Card>

      {/* Profile Settings */}
      <Card padding="lg">
        <SectionHeader
          title="Online Profile"
          subtitle="How this team member appears to clients"
          icon={<UserIcon className="w-5 h-5" />}
        />

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.displayOrder}
                onChange={(e) => onChange({ ...settings, displayOrder: Number(e.target.value) })}
                min="1"
                className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-gray-500">position in team list</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Online Profile Bio
            </label>
            <textarea
              value={settings.profileBio || ''}
              onChange={(e) => onChange({ ...settings, profileBio: e.target.value })}
              placeholder="Short bio for online booking page..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to use main profile bio
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialties
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(settings.specialties || []).map((specialty) => (
                <span
                  key={specialty}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-sm"
                >
                  {specialty}
                  <button
                    onClick={() => removeSpecialty(specialty)}
                    className="hover:text-cyan-900"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {(!settings.specialties || settings.specialties.length === 0) && (
                <span className="text-sm text-gray-400">No specialties added</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                placeholder="Add specialty..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <Button variant="outline" size="sm" onClick={addSpecialty}>
                Add
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview Card */}
      <Card padding="lg" className="bg-gradient-to-br from-gray-50 to-gray-100">
        <SectionHeader
          title="Online Booking Preview"
          subtitle="How clients will see this team member"
          icon={<EyeIcon className="w-5 h-5" />}
        />

        <div className="mt-4 bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
              {memberName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">{memberName}</h4>
              {settings.specialties && settings.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {settings.specialties.slice(0, 3).map((s) => (
                    <span key={s} className="text-xs text-cyan-600">{s}</span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {settings.profileBio || 'Experienced professional dedicated to providing excellent service.'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {settings.acceptNewClients && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckIcon className="w-4 h-4" />
                  Accepts new clients
                </span>
              )}
            </div>
            <Button variant="primary" size="sm">
              Book Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Booking Link */}
      {settings.bookingUrl && (
        <Card padding="md" className="bg-cyan-50 border-cyan-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-cyan-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Direct Booking Link</p>
              <p className="text-cyan-600 text-sm truncate">{settings.bookingUrl}</p>
            </div>
            <Button variant="outline" size="sm" icon={<CopyIcon className="w-4 h-4" />}>
              Copy
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

// Icons
const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

export default OnlineBookingSection;
