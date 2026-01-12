/**
 * Device Registration Service
 *
 * Handles Store App device registration with Supabase salon_devices table.
 * Generates and manages device ID and pairing codes for Mango Pad integration.
 */

import { supabase } from './supabase/client';
import type { SalonDeviceRow, SalonDeviceInsert, SalonDeviceRole } from './supabase/types';

// LocalStorage keys
const DEVICE_ID_KEY = 'mango_store_device_id';
const PAIRING_CODE_KEY = 'mango_store_pairing_code';

// Default values
const DEFAULT_STATION_NAME = 'Checkout Station';
const DEFAULT_DEVICE_ROLE: SalonDeviceRole = 'store-app';
const PAIRING_CODE_LENGTH = 6;

// Characters for pairing code (uppercase alphanumeric, excluding confusing chars)
const PAIRING_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a unique device ID (UUID-like)
 */
function generateDeviceId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a 6-character alphanumeric pairing code (uppercase)
 */
export function generatePairingCode(): string {
  let code = '';
  for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * PAIRING_CODE_CHARS.length);
    code += PAIRING_CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Format pairing code for display (with dash in middle: ABC-123)
 */
export function formatPairingCode(code: string): string {
  if (code.length !== PAIRING_CODE_LENGTH) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Parse pairing code from user input (remove dashes/spaces, uppercase)
 */
export function parsePairingCode(input: string): string {
  return input.replace(/[-\s]/g, '').toUpperCase().slice(0, PAIRING_CODE_LENGTH);
}

/**
 * Get or create the device ID for this Store App instance
 */
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('[DeviceRegistration] Generated new device ID:', deviceId);
  }

  return deviceId;
}

/**
 * Get the current pairing code from localStorage (may be null if not registered)
 */
export function getStoredPairingCode(): string | null {
  return localStorage.getItem(PAIRING_CODE_KEY);
}

/**
 * Store the pairing code in localStorage
 */
function storePairingCode(code: string): void {
  localStorage.setItem(PAIRING_CODE_KEY, code);
}

/**
 * Detect device type based on platform
 */
function detectDeviceType(): 'ios' | 'android' | 'web' | 'desktop' {
  // Check for Electron (desktop)
  if (typeof window !== 'undefined' && 'electronAPI' in window) {
    return 'desktop';
  }

  // Check for Capacitor (mobile)
  if (typeof window !== 'undefined' && 'Capacitor' in window) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'ios';
    }
    if (userAgent.includes('android')) {
      return 'android';
    }
  }

  return 'web';
}

/**
 * Device registration result
 */
export interface DeviceRegistrationResult {
  success: boolean;
  deviceId: string;
  pairingCode: string;
  stationName: string;
  error?: string;
}

/**
 * Register or update this device in Supabase salon_devices table
 */
export async function registerDevice(storeId: string): Promise<DeviceRegistrationResult> {
  const deviceId = getOrCreateDeviceId();
  let pairingCode = getStoredPairingCode();

  // Generate new pairing code if we don't have one
  if (!pairingCode) {
    pairingCode = generatePairingCode();
    console.log('[DeviceRegistration] Generated new pairing code:', pairingCode);
  }

  try {
    // Check if device already exists
    const { data: existingDevice, error: fetchError } = await supabase
      .from('salon_devices')
      .select('*')
      .eq('store_id', storeId)
      .eq('device_fingerprint', deviceId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected for new devices
      throw fetchError;
    }

    const deviceType = detectDeviceType();
    const now = new Date().toISOString();

    if (existingDevice) {
      // Update existing device - keep existing pairing code, update online status
      const { error: updateError } = await supabase
        .from('salon_devices')
        .update({
          is_online: true,
          last_seen_at: now,
          device_type: deviceType,
          device_role: DEFAULT_DEVICE_ROLE,
        })
        .eq('id', existingDevice.id);

      if (updateError) {
        throw updateError;
      }

      // Use existing pairing code from database if available
      const existingPairingCode = existingDevice.pairing_code;
      if (existingPairingCode) {
        pairingCode = existingPairingCode;
      } else {
        // Update with new pairing code if database doesn't have one
        await supabase
          .from('salon_devices')
          .update({ pairing_code: pairingCode })
          .eq('id', existingDevice.id);
      }

      // At this point pairingCode is guaranteed to be a string (either from DB or generated)
      const finalPairingCode = pairingCode as string;

      // Store the pairing code locally
      storePairingCode(finalPairingCode);

      console.log('[DeviceRegistration] Updated existing device:', existingDevice.id);

      return {
        success: true,
        deviceId,
        pairingCode: finalPairingCode,
        stationName: existingDevice.station_name || DEFAULT_STATION_NAME,
      };
    }

    // Insert new device
    const newDevice: SalonDeviceInsert = {
      store_id: storeId,
      device_fingerprint: deviceId,
      device_name: `Store App - ${deviceType}`,
      device_type: deviceType,
      device_role: DEFAULT_DEVICE_ROLE,
      station_name: DEFAULT_STATION_NAME,
      pairing_code: pairingCode,
      is_online: true,
      is_hub: deviceType === 'desktop', // Desktop apps typically run the local broker
      last_seen_at: now,
      mqtt_port: 1883,
      capabilities: {},
      settings: {},
    };

    const { data: insertedDevice, error: insertError } = await supabase
      .from('salon_devices')
      .insert(newDevice)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Store the pairing code locally
    storePairingCode(pairingCode);

    console.log('[DeviceRegistration] Registered new device:', insertedDevice.id);

    return {
      success: true,
      deviceId,
      pairingCode,
      stationName: DEFAULT_STATION_NAME,
    };

  } catch (error) {
    console.error('[DeviceRegistration] Registration failed:', error);
    console.error('[DeviceRegistration] Error details:', JSON.stringify(error, null, 2));
    console.error('[DeviceRegistration] storeId:', storeId);
    console.error('[DeviceRegistration] deviceId:', deviceId);

    // Extract better error message from Supabase error
    let errorMessage = 'Unknown error';
    if (error && typeof error === 'object') {
      const supabaseError = error as { message?: string; code?: string; details?: string; hint?: string };
      errorMessage = supabaseError.message || supabaseError.details || supabaseError.hint || 'Unknown error';
      if (supabaseError.code) {
        errorMessage = `[${supabaseError.code}] ${errorMessage}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      deviceId,
      pairingCode: pairingCode || '',
      stationName: DEFAULT_STATION_NAME,
      error: errorMessage,
    };
  }
}

/**
 * Regenerate the pairing code for this device
 */
export async function regeneratePairingCode(storeId: string): Promise<{
  success: boolean;
  pairingCode: string;
  error?: string;
}> {
  const deviceId = getOrCreateDeviceId();
  const newPairingCode = generatePairingCode();

  try {
    const { error } = await supabase
      .from('salon_devices')
      .update({
        pairing_code: newPairingCode,
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .eq('device_fingerprint', deviceId);

    if (error) {
      throw error;
    }

    // Store the new pairing code locally
    storePairingCode(newPairingCode);

    console.log('[DeviceRegistration] Regenerated pairing code:', newPairingCode);

    return {
      success: true,
      pairingCode: newPairingCode,
    };

  } catch (error) {
    console.error('[DeviceRegistration] Failed to regenerate pairing code:', error);

    return {
      success: false,
      pairingCode: getStoredPairingCode() || '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update the station name for this device
 */
export async function updateStationName(storeId: string, stationName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const deviceId = getOrCreateDeviceId();

  try {
    const { error } = await supabase
      .from('salon_devices')
      .update({
        station_name: stationName,
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .eq('device_fingerprint', deviceId);

    if (error) {
      throw error;
    }

    console.log('[DeviceRegistration] Updated station name:', stationName);

    return { success: true };

  } catch (error) {
    console.error('[DeviceRegistration] Failed to update station name:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark device as offline (call on app close/disconnect)
 */
export async function markDeviceOffline(storeId: string): Promise<void> {
  const deviceId = getOrCreateDeviceId();

  try {
    await supabase
      .from('salon_devices')
      .update({
        is_online: false,
        last_seen_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .eq('device_fingerprint', deviceId);

    console.log('[DeviceRegistration] Marked device as offline');
  } catch (error) {
    console.error('[DeviceRegistration] Failed to mark device offline:', error);
  }
}

/**
 * Get all devices paired to this station
 */
export async function getPairedDevices(storeId: string): Promise<SalonDeviceRow[]> {
  const deviceId = getOrCreateDeviceId();

  try {
    const { data, error } = await supabase
      .from('salon_devices')
      .select('*')
      .eq('store_id', storeId)
      .eq('paired_to_device_id', deviceId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[DeviceRegistration] Failed to get paired devices:', error);
    return [];
  }
}

/**
 * Unpair a device from this station (US-012)
 * Sets paired_to_device_id = null in Supabase
 */
export async function unpairDevice(
  storeId: string,
  padDeviceFingerprint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('salon_devices')
      .update({
        paired_to_device_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .eq('device_fingerprint', padDeviceFingerprint);

    if (error) {
      throw error;
    }

    console.log('[DeviceRegistration] Unpaired device:', padDeviceFingerprint);
    return { success: true };
  } catch (error) {
    console.error('[DeviceRegistration] Failed to unpair device:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
