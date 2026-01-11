/**
 * Pairing Service
 *
 * Handles device pairing logic:
 * - Verify pairing code against Supabase salon_devices table
 * - Register this Mango Pad as a paired device
 * - Persist pairing info to localStorage
 *
 * Part of: Device Pairing System (US-007)
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { PairingInfo, SalonDevice } from '../types';

// ============================================================================
// Constants
// ============================================================================

const PAIRING_STORAGE_KEY = 'mango_pad_pairing';
const DEVICE_ID_STORAGE_KEY = 'mango_pad_device_id';

// Characters for generating device IDs (excludes confusing chars: 0, O, 1, I)
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ============================================================================
// Pairing Result Types
// ============================================================================

export type PairingResult =
  | { success: true; pairing: PairingInfo }
  | { success: false; error: 'invalid_code' | 'network_error' | 'not_configured' };

// ============================================================================
// Device ID Management
// ============================================================================

/**
 * Get or generate a unique device ID for this Mango Pad
 */
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (!deviceId) {
    // Generate a random 12-character device ID
    deviceId = Array.from(
      { length: 12 },
      () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
    ).join('');
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Get platform type for device_type field
 */
function getDeviceType(): 'ios' | 'android' | 'web' {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web';
}

// ============================================================================
// Pairing Storage
// ============================================================================

/**
 * Get current pairing info from localStorage
 */
export function getPairingInfo(): PairingInfo | null {
  const stored = localStorage.getItem(PAIRING_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as PairingInfo;
  } catch {
    return null;
  }
}

/**
 * Save pairing info to localStorage
 */
function savePairingInfo(pairing: PairingInfo): void {
  localStorage.setItem(PAIRING_STORAGE_KEY, JSON.stringify(pairing));
}

/**
 * Clear pairing info from localStorage
 */
export function clearPairingInfo(): void {
  localStorage.removeItem(PAIRING_STORAGE_KEY);
}

// ============================================================================
// Pairing Verification
// ============================================================================

/**
 * Verify a pairing code and establish connection with Store App station
 *
 * Steps:
 * 1. Query salon_devices by pairing_code (case-insensitive)
 * 2. Verify code belongs to a device_role: 'store-app'
 * 3. Create/update this Mango Pad's record with paired_to_device_id
 * 4. Save pairing info to localStorage
 *
 * @param code - 6-character pairing code (e.g., "A7X92K")
 * @returns PairingResult with success/error info
 */
export async function verifyPairingCode(code: string): Promise<PairingResult> {
  // Check if Supabase is configured
  if (!isSupabaseConfigured() || !supabase) {
    console.error('[PairingService] Supabase not configured');
    return { success: false, error: 'not_configured' };
  }

  // Normalize code to uppercase
  const normalizedCode = code.toUpperCase().replace(/[-\s]/g, '');

  try {
    // Step 1: Find the Store App station with this pairing code
    // Note: We use ILIKE for case-insensitive matching
    const { data: station, error: queryError } = await supabase
      .from('salon_devices')
      .select('*')
      .ilike('pairing_code', normalizedCode)
      .eq('device_role', 'store-app')
      .single();

    if (queryError) {
      // PGRST116 = no rows found (invalid code)
      if (queryError.code === 'PGRST116') {
        console.log('[PairingService] Invalid pairing code:', normalizedCode);
        return { success: false, error: 'invalid_code' };
      }
      // Other database errors
      console.error('[PairingService] Query error:', queryError);
      return { success: false, error: 'network_error' };
    }

    if (!station) {
      return { success: false, error: 'invalid_code' };
    }

    // Cast to our type
    const stationDevice = station as SalonDevice;

    // Step 2: Get or create this Mango Pad's device ID
    const deviceId = getOrCreateDeviceId();
    const deviceType = getDeviceType();

    // Step 3: Upsert this Mango Pad's record
    const { error: upsertError } = await supabase.from('salon_devices').upsert(
      {
        store_id: stationDevice.store_id,
        device_fingerprint: deviceId,
        device_name: 'Mango Pad',
        device_type: deviceType,
        device_role: 'mango-pad',
        paired_to_device_id: stationDevice.device_fingerprint,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: 'store_id,device_fingerprint',
      }
    );

    if (upsertError) {
      console.error('[PairingService] Upsert error:', upsertError);
      return { success: false, error: 'network_error' };
    }

    // Step 4: Create and save pairing info
    const pairing: PairingInfo = {
      stationId: stationDevice.device_fingerprint,
      salonId: stationDevice.store_id,
      stationName: stationDevice.station_name || 'Checkout Station',
      deviceId: deviceId,
      pairedAt: new Date().toISOString(),
    };

    savePairingInfo(pairing);

    console.log('[PairingService] Pairing successful:', pairing);
    return { success: true, pairing };
  } catch (err) {
    console.error('[PairingService] Unexpected error:', err);
    return { success: false, error: 'network_error' };
  }
}

/**
 * Check if this device is currently paired
 */
export function isPaired(): boolean {
  return getPairingInfo() !== null;
}

/**
 * Unpair this device (for self-initiated unpair)
 * Clears localStorage and optionally updates Supabase
 */
export async function unpairDevice(): Promise<void> {
  const pairing = getPairingInfo();

  if (pairing && isSupabaseConfigured() && supabase) {
    try {
      // Update Supabase to clear paired_to_device_id
      await supabase
        .from('salon_devices')
        .update({
          paired_to_device_id: null,
          is_online: false,
        })
        .eq('store_id', pairing.salonId)
        .eq('device_fingerprint', pairing.deviceId);
    } catch (err) {
      console.error('[PairingService] Error updating Supabase on unpair:', err);
      // Continue anyway - we still want to clear local pairing
    }
  }

  clearPairingInfo();
  console.log('[PairingService] Device unpaired');
}
