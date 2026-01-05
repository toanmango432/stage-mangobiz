import React from 'react';
import type { EnhancedClient } from '../types';
import { Card, Toggle, Select, Input, Textarea } from '../components/SharedComponents';

interface PreferencesSectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  client,
  onChange,
}) => {
  const updatePreferences = (field: string, value: any) => {
    onChange({
      preferences: { ...client.preferences, [field]: value },
    });
  };

  const updateCommPreferences = (field: string, value: any) => {
    onChange({
      communicationPreferences: { ...client.communicationPreferences, [field]: value },
    });
  };

  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Service Preferences */}
      <Card title="Service Preferences" description="Client's preferences for their appointments">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Preferred Appointment Time"
              value={client.preferences?.preferredTimes || ''}
              onChange={(v) => updatePreferences('preferredTimes', v)}
              options={[
                { value: 'morning', label: 'Morning (9am - 12pm)' },
                { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
                { value: 'evening', label: 'Evening (5pm - 8pm)' },
                { value: 'anytime', label: 'Anytime' },
              ]}
              placeholder="Select preferred time"
            />

            <Select
              label="Pressure Preference (Massage)"
              value={client.preferences?.pressurePreference || ''}
              onChange={(v) => updatePreferences('pressurePreference', v)}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'medium', label: 'Medium' },
                { value: 'firm', label: 'Firm' },
                { value: 'deep', label: 'Deep Tissue' },
              ]}
              placeholder="Select pressure"
            />
          </div>

          {/* Preferred Days */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Preferred Days
            </label>
            <div className="flex flex-wrap gap-2">
              {dayLabels.map((day, index) => {
                const isSelected = client.preferences?.preferredDays?.includes(index);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const currentDays = client.preferences?.preferredDays || [];
                      const newDays = isSelected
                        ? currentDays.filter((d) => d !== index)
                        : [...currentDays, index];
                      updatePreferences('preferredDays', newDays);
                    }}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${isSelected
                        ? 'bg-cyan-100 text-cyan-700 border-2 border-cyan-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }
                    `}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <Toggle
            label="Prefers Quiet Environment"
            description="Client prefers minimal conversation during services"
            checked={client.preferences?.quietEnvironment || false}
            onChange={(v) => updatePreferences('quietEnvironment', v)}
          />
        </div>
      </Card>

      {/* Comfort Preferences */}
      <Card title="Comfort Preferences" description="Make their visit more comfortable">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Beverage Preference"
            value={client.preferences?.beveragePreference || ''}
            onChange={(v) => updatePreferences('beveragePreference', v)}
            placeholder="e.g., Iced Latte, Water, Tea"
          />

          <Input
            label="Music Preference"
            value={client.preferences?.musicPreference || ''}
            onChange={(v) => updatePreferences('musicPreference', v)}
            placeholder="e.g., Jazz, Pop, No music"
          />

          <Input
            label="Magazine Preference"
            value={client.preferences?.magazinePreference || ''}
            onChange={(v) => updatePreferences('magazinePreference', v)}
            placeholder="e.g., Fashion, News, None"
          />

          <Select
            label="Room Temperature"
            value={client.preferences?.roomTemperature || ''}
            onChange={(v) => updatePreferences('roomTemperature', v)}
            options={[
              { value: 'warm', label: 'Warm' },
              { value: 'cool', label: 'Cool' },
              { value: 'no_preference', label: 'No Preference' },
            ]}
            placeholder="Select preference"
          />
        </div>

        <Textarea
          label="Other Notes"
          value={client.preferences?.otherNotes || ''}
          onChange={(v) => updatePreferences('otherNotes', v)}
          placeholder="Any other preferences or special requests..."
          rows={3}
          className="mt-4"
        />
      </Card>

      {/* Communication Preferences */}
      <Card title="Communication Preferences" description="How the client wants to be contacted">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Preferred Contact Method"
              value={client.contact.preferredContact}
              onChange={(v) =>
                onChange({
                  contact: { ...client.contact, preferredContact: v as any },
                })
              }
              options={[
                { value: 'sms', label: 'Text Message (SMS)' },
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone Call' },
                { value: 'app_notification', label: 'App Notification' },
              ]}
            />

            <Select
              label="Best Time to Contact"
              value={client.communicationPreferences?.bestTimeToContact || ''}
              onChange={(v) => updateCommPreferences('bestTimeToContact', v)}
              options={[
                { value: 'morning', label: 'Morning' },
                { value: 'afternoon', label: 'Afternoon' },
                { value: 'evening', label: 'Evening' },
                { value: 'anytime', label: 'Anytime' },
              ]}
              placeholder="Select time"
            />

            <Select
              label="Reminder Timing"
              value={String(client.communicationPreferences.reminderTiming)}
              onChange={(v) => updateCommPreferences('reminderTiming', parseInt(v))}
              options={[
                { value: '2', label: '2 hours before' },
                { value: '12', label: '12 hours before' },
                { value: '24', label: '24 hours before' },
                { value: '48', label: '48 hours before' },
              ]}
            />

            <Input
              label="Preferred Language"
              value={client.communicationPreferences?.preferredLanguage || ''}
              onChange={(v) => updateCommPreferences('preferredLanguage', v)}
              placeholder="e.g., English, Spanish"
            />
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Permissions</h4>
            <div className="space-y-3">
              <Toggle
                label="Allow SMS"
                description="Receive appointment reminders via text"
                checked={client.communicationPreferences.allowSms}
                onChange={(v) => updateCommPreferences('allowSms', v)}
              />

              <Toggle
                label="Allow Email"
                description="Receive emails for confirmations and updates"
                checked={client.communicationPreferences.allowEmail}
                onChange={(v) => updateCommPreferences('allowEmail', v)}
              />

              <Toggle
                label="Allow Phone Calls"
                description="Can be contacted by phone"
                checked={client.communicationPreferences.allowPhone}
                onChange={(v) => updateCommPreferences('allowPhone', v)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Preferences</h4>
            <div className="space-y-3">
              <Toggle
                label="Appointment Reminders"
                description="Receive reminders before appointments"
                checked={client.communicationPreferences.appointmentReminders}
                onChange={(v) => updateCommPreferences('appointmentReminders', v)}
              />

              <Toggle
                label="Birthday Greetings"
                description="Receive birthday wishes and offers"
                checked={client.communicationPreferences.birthdayGreetings}
                onChange={(v) => updateCommPreferences('birthdayGreetings', v)}
              />

              <Toggle
                label="Marketing & Promotions"
                description="Receive promotional offers and updates"
                checked={client.communicationPreferences.allowMarketing}
                onChange={(v) => updateCommPreferences('allowMarketing', v)}
              />

              <Toggle
                label="Newsletter"
                description="Subscribe to the newsletter"
                checked={client.communicationPreferences.newsletterSubscribed}
                onChange={(v) => updateCommPreferences('newsletterSubscribed', v)}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PreferencesSection;
