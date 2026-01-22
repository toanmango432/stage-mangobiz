/**
 * ConsentManagement - GDPR/CCPA Consent Preference Management
 * Allows staff to view and manage client consent preferences.
 *
 * Features:
 * - Toggle switches for each consent type (SMS, Email, Marketing, Photo, Data Processing)
 * - Shows timestamp of last consent change
 * - "Do Not Contact" master toggle that disables all communication
 * - Logs changes to data_retention_logs for compliance auditing
 */

import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateClientInSupabase, logDataRetention } from '@/store/slices/clientsSlice';
import { selectMemberId, selectCurrentUser } from '@/store/slices/authSlice';
import type { Client, DataRetentionAction } from '@/types';

// ==================== ICONS ====================

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BellOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ==================== TYPES ====================

interface ConsentManagementProps {
  client: Client;
  onChange?: (updates: Partial<Client>) => void;
  readOnly?: boolean;
  className?: string;
}

interface ConsentItem {
  id: string;
  label: string;
  description: string;
  field: string; // Field name in communicationPreferences or client
  timestampField?: string;
  category: 'communication' | 'gdpr';
  isCommunicationPref?: boolean; // If true, field is in communicationPreferences
  logActionGranted?: DataRetentionAction;
  logActionRevoked?: DataRetentionAction;
}

// ==================== CONSENT ITEMS ====================

const consentItems: ConsentItem[] = [
  {
    id: 'sms',
    label: 'SMS/Text Messages',
    description: 'Receive appointment reminders and updates via text',
    field: 'allowSms',
    timestampField: 'smsOptInDate',
    category: 'communication',
    isCommunicationPref: true,
  },
  {
    id: 'email',
    label: 'Email Communications',
    description: 'Receive emails for confirmations, updates, and receipts',
    field: 'allowEmail',
    timestampField: 'emailOptInDate',
    category: 'communication',
    isCommunicationPref: true,
  },
  {
    id: 'phone',
    label: 'Phone Calls',
    description: 'Allow contact via phone for appointments and inquiries',
    field: 'allowPhone',
    category: 'communication',
    isCommunicationPref: true,
  },
  {
    id: 'marketing',
    label: 'Marketing Communications',
    description: 'Receive promotional offers, deals, and newsletters',
    field: 'consentMarketing',
    timestampField: 'consentMarketingAt',
    category: 'gdpr',
    isCommunicationPref: false,
    logActionGranted: 'consent_marketing_granted',
    logActionRevoked: 'consent_marketing_revoked',
  },
  {
    id: 'photo',
    label: 'Photo Consent',
    description: 'Allow photos to be taken and used for service records',
    field: 'photoConsent',
    category: 'communication',
    isCommunicationPref: true,
  },
  {
    id: 'dataProcessing',
    label: 'Data Processing',
    description: 'Required for providing services. Covers storing preferences and service history.',
    field: 'consentDataProcessing',
    timestampField: 'consentDataProcessingAt',
    category: 'gdpr',
    isCommunicationPref: false,
    logActionGranted: 'consent_data_processing_granted',
    logActionRevoked: 'consent_data_processing_revoked',
  },
];

// ==================== TOGGLE COMPONENT ====================

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  timestamp?: string;
  variant?: 'default' | 'danger';
}

const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  timestamp,
  variant = 'default',
}) => {
  const formatTimestamp = (ts?: string) => {
    if (!ts) return null;
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formattedTimestamp = formatTimestamp(timestamp);

  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${variant === 'danger' ? 'text-red-700' : 'text-gray-900'}`}>
            {label}
          </span>
          {checked && variant === 'default' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
              <CheckIcon className="w-3 h-3" />
              Enabled
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
        {formattedTimestamp && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            Last updated: {formattedTimestamp}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${variant === 'danger'
            ? checked
              ? 'bg-red-600 focus:ring-red-500'
              : 'bg-gray-200 focus:ring-red-500'
            : checked
              ? 'bg-cyan-600 focus:ring-cyan-500'
              : 'bg-gray-200 focus:ring-cyan-500'
          }
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export const ConsentManagement: React.FC<ConsentManagementProps> = ({
  client,
  onChange,
  readOnly = false,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const currentMemberId = useAppSelector(selectMemberId);
  const currentUser = useAppSelector(selectCurrentUser);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get consent value from client
  const getConsentValue = (item: ConsentItem): boolean => {
    if (item.isCommunicationPref) {
      const commPrefs = client.communicationPreferences;
      if (!commPrefs) return false;
      // Type-safe access to communication preferences
      switch (item.field) {
        case 'allowSms': return commPrefs.allowSms ?? false;
        case 'allowEmail': return commPrefs.allowEmail ?? false;
        case 'allowPhone': return commPrefs.allowPhone ?? false;
        case 'allowMarketing': return commPrefs.allowMarketing ?? false;
        case 'photoConsent': return commPrefs.photoConsent ?? false;
        default: return false;
      }
    }
    // GDPR fields are on client directly
    if (item.field === 'consentMarketing') return client.consentMarketing ?? false;
    if (item.field === 'consentDataProcessing') return client.consentDataProcessing ?? true; // Default to true
    return false;
  };

  // Get timestamp for consent
  const getConsentTimestamp = (item: ConsentItem): string | undefined => {
    if (!item.timestampField) return undefined;
    if (item.timestampField === 'consentMarketingAt') return client.consentMarketingAt;
    if (item.timestampField === 'consentDataProcessingAt') return client.consentDataProcessingAt;
    if (item.timestampField === 'smsOptInDate') return client.communicationPreferences?.smsOptInDate;
    if (item.timestampField === 'emailOptInDate') return client.communicationPreferences?.emailOptInDate;
    return undefined;
  };

  // Handle consent change
  const handleConsentChange = useCallback(async (item: ConsentItem, newValue: boolean) => {
    if (readOnly || !currentMemberId) return;

    setSaving(true);
    setSuccessMessage(null);

    try {
      const now = new Date().toISOString();
      let updates: Partial<Client> = {};

      // Build updates based on field type
      if (item.field === 'consentMarketing') {
        updates = {
          consentMarketing: newValue,
          consentMarketingAt: now,
        };
      } else if (item.field === 'consentDataProcessing') {
        updates = {
          consentDataProcessing: newValue,
          consentDataProcessingAt: now,
        };
      } else if (item.isCommunicationPref) {
        // Communication preferences - need to build complete object to satisfy type
        const currentPrefs = client.communicationPreferences || {
          allowEmail: false,
          allowSms: false,
          allowPhone: false,
          allowMarketing: false,
          appointmentReminders: true,
          reminderTiming: 24,
          birthdayGreetings: true,
          promotionalOffers: false,
          newsletterSubscribed: false,
        };
        const timestampUpdate: Record<string, string> = {};
        if (item.timestampField) {
          timestampUpdate[item.timestampField] = now;
        }
        updates = {
          communicationPreferences: {
            ...currentPrefs,
            [item.field]: newValue,
            ...timestampUpdate,
          },
        };
      }

      // Call onChange for local state update if provided
      onChange?.(updates);

      // Save to Supabase
      await dispatch(
        updateClientInSupabase({
          id: client.id,
          updates,
        })
      ).unwrap();

      // Log to data retention logs for GDPR auditing
      if (item.logActionGranted && item.logActionRevoked) {
        const action = newValue ? item.logActionGranted : item.logActionRevoked;
        await dispatch(
          logDataRetention({
            clientId: client.id,
            storeId: client.storeId,
            action,
            fieldsAffected: [item.field],
            performedBy: currentMemberId,
            performedByName: currentUser?.name || currentUser?.email,
          })
        );
      }

      setSuccessMessage(`${item.label} ${newValue ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Failed to update consent:', err);
    } finally {
      setSaving(false);
    }
  }, [client, currentMemberId, currentUser, dispatch, onChange, readOnly]);

  // Handle Do Not Contact toggle
  const handleDoNotContact = useCallback(async (newValue: boolean) => {
    if (readOnly || !currentMemberId) return;

    setSaving(true);
    setSuccessMessage(null);

    try {
      const now = new Date().toISOString();
      const currentPrefs = client.communicationPreferences || {
        allowEmail: false,
        allowSms: false,
        allowPhone: false,
        allowMarketing: false,
        appointmentReminders: true,
        reminderTiming: 24,
        birthdayGreetings: true,
        promotionalOffers: false,
        newsletterSubscribed: false,
      };
      const updates: Partial<Client> = {
        communicationPreferences: {
          ...currentPrefs,
          doNotContact: newValue,
          // If enabling do not contact, disable all communication
          ...(newValue ? {
            allowEmail: false,
            allowSms: false,
            allowPhone: false,
            allowMarketing: false,
          } : {}),
        },
        // Also update GDPR consent fields
        ...(newValue ? {
          consentMarketing: false,
          consentMarketingAt: now,
        } : {}),
      };

      onChange?.(updates);

      await dispatch(
        updateClientInSupabase({
          id: client.id,
          updates,
        })
      ).unwrap();

      // Log the change
      await dispatch(
        logDataRetention({
          clientId: client.id,
          storeId: client.storeId,
          action: 'consent_updated',
          fieldsAffected: newValue
            ? ['doNotContact', 'allowEmail', 'allowSms', 'allowPhone', 'allowMarketing', 'consentMarketing']
            : ['doNotContact'],
          performedBy: currentMemberId,
          performedByName: currentUser?.name || currentUser?.email,
        })
      );

      setSuccessMessage(newValue ? 'Do Not Contact enabled - all communications disabled' : 'Do Not Contact disabled');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update Do Not Contact:', err);
    } finally {
      setSaving(false);
    }
  }, [client, currentMemberId, currentUser, dispatch, onChange, readOnly]);

  const isDoNotContact = client.communicationPreferences?.doNotContact ?? false;
  const communicationItems = consentItems.filter(item => item.category === 'communication');
  const gdprItems = consentItems.filter(item => item.category === 'gdpr');

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
            <ShieldIcon className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Privacy & Consent</h3>
            <p className="text-sm text-gray-500">Manage communication and data processing preferences</p>
          </div>
        </div>
        {saving && (
          <span className="text-sm text-gray-500 animate-pulse">Saving...</span>
        )}
        {successMessage && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckIcon className="w-4 h-4" />
            {successMessage}
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Do Not Contact - Master Toggle */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <Toggle
            label="Do Not Contact"
            description="Disable ALL communications for this client. Overrides individual settings below."
            checked={isDoNotContact}
            onChange={handleDoNotContact}
            disabled={readOnly || saving}
            variant="danger"
          />
          {isDoNotContact && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <BellOffIcon className="w-4 h-4" />
              <span>All communications are currently disabled for this client</span>
            </div>
          )}
        </div>

        {/* Communication Preferences */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Communication Preferences</h4>
          <div className="divide-y divide-gray-100">
            {communicationItems.map((item) => (
              <Toggle
                key={item.id}
                label={item.label}
                description={item.description}
                checked={getConsentValue(item)}
                onChange={(value) => handleConsentChange(item, value)}
                disabled={readOnly || saving || isDoNotContact}
                timestamp={getConsentTimestamp(item)}
              />
            ))}
          </div>
        </div>

        {/* GDPR Consent */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">GDPR/CCPA Consent</h4>
          <p className="text-xs text-gray-500 mb-3">
            These consents are required for legal compliance. Changes are logged for auditing.
          </p>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {gdprItems.map((item) => (
              <div key={item.id} className="px-4 bg-gray-50">
                <Toggle
                  label={item.label}
                  description={item.description}
                  checked={getConsentValue(item)}
                  onChange={(value) => handleConsentChange(item, value)}
                  disabled={readOnly || saving || (item.field === 'consentMarketing' && isDoNotContact)}
                  timestamp={getConsentTimestamp(item)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info Note */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p>
            <strong>Note:</strong> Changes to consent preferences are automatically saved and logged
            for GDPR/CCPA compliance. Marketing consent changes require explicit client agreement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentManagement;
