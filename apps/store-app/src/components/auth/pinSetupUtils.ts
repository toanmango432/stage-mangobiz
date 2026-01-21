/**
 * PIN Setup Utilities
 *
 * Helper functions for managing PIN setup skip preferences.
 * Separated from PinSetupModal.tsx to enable React Fast Refresh (HMR).
 */

import { AUTH_STORAGE_KEYS } from './constants';

/**
 * Get the localStorage key for skip preference
 */
function getSkipPreferenceKey(memberId: string): string {
  return `${AUTH_STORAGE_KEYS.PIN_SETUP_SKIPPED_PREFIX}${memberId}`;
}

/**
 * Check if a member has previously skipped PIN setup
 * @param memberId - The member ID to check
 * @returns true if the member has skipped PIN setup
 */
export function hasSkippedPinSetup(memberId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getSkipPreferenceKey(memberId)) === 'true';
}

/**
 * Clear the skip preference for a member (for when they set up PIN)
 * @param memberId - The member ID to clear the preference for
 */
export function clearSkipPreference(memberId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getSkipPreferenceKey(memberId));
}

/**
 * Set the skip preference for a member (when they choose to skip PIN setup)
 * @param memberId - The member ID to set the preference for
 */
export function setSkipPreference(memberId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getSkipPreferenceKey(memberId), 'true');
}
