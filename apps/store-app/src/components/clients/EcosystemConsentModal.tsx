/**
 * EcosystemConsentModal - Manage client's ecosystem opt-in
 *
 * Allows staff to opt a client into or out of the Mango ecosystem,
 * with granular control over what data is shared.
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { optIntoEcosystem } from '@/store/slices/clientsSlice/multiStoreThunks';
import { supabase } from '@/services/supabase/client';
import type { Client, SharingPreferences } from '@/types/client';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/spinner';

// ==================== ICONS ====================

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

// ==================== TYPES ====================

interface EcosystemConsentModalProps {
  /** Client to manage ecosystem consent for */
  client: Client;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when opt-in/opt-out is complete */
  onComplete?: () => void;
}

interface PreferenceItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
}

// ==================== HELPER COMPONENTS ====================

const PreferenceItem: React.FC<PreferenceItemProps> = ({
  id,
  icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  required = false,
}) => (
  <label
    htmlFor={id}
    className={`
      flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
      ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50'}
      ${checked ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200'}
    `}
  >
    <div className={`
      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
      ${checked ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500'}
    `}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {required && (
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
            Always Shared
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled || required}
      className={`
        w-5 h-5 rounded border-gray-300 text-cyan-600
        focus:ring-cyan-500 focus:ring-offset-0
        ${disabled || required ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    />
  </label>
);

// ==================== MAIN COMPONENT ====================

export const EcosystemConsentModal: React.FC<EcosystemConsentModalProps> = ({
  client,
  isOpen,
  onClose,
  onComplete,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptOutConfirm, setShowOptOutConfirm] = useState(false);

  // Sharing preferences state
  const [preferences, setPreferences] = useState<SharingPreferences>({
    basicInfo: true,
    preferences: true,
    visitHistory: false,
    loyaltyData: false,
    safetyData: true, // Always true
  });

  // Check if client is already opted in
  const isOptedIn = Boolean(client.mangoIdentityId);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowOptOutConfirm(false);
      // Reset preferences to defaults
      setPreferences({
        basicInfo: true,
        preferences: true,
        visitHistory: false,
        loyaltyData: false,
        safetyData: true,
      });
    }
  }, [isOpen]);

  // Handle preference change
  const handlePreferenceChange = (key: keyof SharingPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  // Handle opt-in
  const handleOptIn = async () => {
    if (!client.phone) {
      setError('Client must have a phone number to opt into the ecosystem');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await dispatch(
        optIntoEcosystem({
          clientId: client.id,
          phone: client.phone,
          email: client.email,
          sharingPreferences: {
            basicInfo: preferences.basicInfo,
            preferences: preferences.preferences,
            visitHistory: preferences.visitHistory,
            loyaltyData: preferences.loyaltyData,
          },
        })
      ).unwrap();

      onComplete?.();
      onClose();
    } catch (err) {
      console.error('[EcosystemConsentModal] Opt-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to opt into ecosystem');
    } finally {
      setLoading(false);
    }
  };

  // Handle opt-out
  const handleOptOut = async () => {
    if (!client.mangoIdentityId) return;

    setLoading(true);
    setError(null);

    try {
      // Update mango_identity to opt out
      const { error: updateError } = await supabase
        .from('mango_identities')
        .update({
          ecosystem_opt_in: false,
          opt_out_date: new Date().toISOString(),
        })
        .eq('id', client.mangoIdentityId);

      if (updateError) throw updateError;

      // Log the opt-out action
      await supabase
        .from('ecosystem_consent_log')
        .insert({
          mango_identity_id: client.mangoIdentityId,
          action: 'opt_out',
          details: {
            clientId: client.id,
          },
          created_at: new Date().toISOString(),
        });

      // Remove mango_identity_id from client
      await supabase
        .from('clients')
        .update({ mango_identity_id: null })
        .eq('id', client.id);

      onComplete?.();
      onClose();
    } catch (err) {
      console.error('[EcosystemConsentModal] Opt-out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to opt out of ecosystem');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <GlobeIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mango Network</h2>
              <p className="text-sm text-gray-500">
                {isOptedIn ? 'Manage ecosystem sharing' : 'Join the Mango network'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Opt-Out Confirmation */}
          {showOptOutConfirm ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2">
                  Are you sure you want to opt out?
                </h3>
                <p className="text-sm text-red-700">
                  This will:
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>Remove this client from the Mango network</li>
                  <li>Stop sharing safety data with other stores</li>
                  <li>Unlink all currently linked stores</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status */}
              {isOptedIn && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckIcon className="w-5 h-5" />
                    <span className="font-medium">Currently opted into Mango Network</span>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">What is the Mango Network?</h3>
                <p className="text-sm text-gray-600">
                  The Mango Network allows client information to be shared between independent
                  Mango locations. This helps provide a seamless experience for clients who
                  visit multiple salons.
                </p>
              </div>

              {/* Sharing Preferences */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Data Sharing Preferences</h3>

                {/* Safety Data - Always shared */}
                <PreferenceItem
                  id="safety"
                  icon={<ShieldCheckIcon className="w-4 h-4" />}
                  label="Safety Data"
                  description="Allergies, blocked status, and staff alerts"
                  checked={true}
                  onChange={() => {}}
                  required
                />

                {/* Basic Info */}
                <PreferenceItem
                  id="basicInfo"
                  icon={<UserIcon className="w-4 h-4" />}
                  label="Basic Profile"
                  description="Name, phone, and email"
                  checked={preferences.basicInfo}
                  onChange={(v) => handlePreferenceChange('basicInfo', v)}
                  disabled={isOptedIn}
                />

                {/* Preferences */}
                <PreferenceItem
                  id="preferences"
                  icon={<HeartIcon className="w-4 h-4" />}
                  label="Preferences"
                  description="Preferred staff, service notes, and communication preferences"
                  checked={preferences.preferences}
                  onChange={(v) => handlePreferenceChange('preferences', v)}
                  disabled={isOptedIn}
                />

                {/* Visit History */}
                <PreferenceItem
                  id="visitHistory"
                  icon={<ClockIcon className="w-4 h-4" />}
                  label="Visit History"
                  description="Past appointments and service history"
                  checked={preferences.visitHistory}
                  onChange={(v) => handlePreferenceChange('visitHistory', v)}
                  disabled={isOptedIn}
                />

                {/* Loyalty Data */}
                <PreferenceItem
                  id="loyaltyData"
                  icon={<StarIcon className="w-4 h-4" />}
                  label="Loyalty Points"
                  description="Points balance and tier status"
                  checked={preferences.loyaltyData}
                  onChange={(v) => handlePreferenceChange('loyaltyData', v)}
                  disabled={isOptedIn}
                />
              </div>

              {/* Phone requirement note */}
              {!client.phone && !isOptedIn && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  A phone number is required to join the Mango Network. Please add a phone number first.
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          {showOptOutConfirm ? (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowOptOutConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleOptOut}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Opting out...
                  </>
                ) : (
                  'Confirm Opt Out'
                )}
              </Button>
            </>
          ) : (
            <>
              <div>
                {isOptedIn && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowOptOutConfirm(true)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Opt Out
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                {!isOptedIn && (
                  <Button
                    variant="default"
                    onClick={handleOptIn}
                    disabled={loading || !client.phone}
                  >
                    {loading ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Opting in...
                      </>
                    ) : (
                      'Opt In to Network'
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EcosystemConsentModal;
