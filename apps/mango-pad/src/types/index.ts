/**
 * Mango Pad Type Definitions
 */

export type PadScreen = 'waiting' | 'tip' | 'signature' | 'receipt' | 'complete' | 'error';

export interface PosConnectionState {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  storeId: string | null;
  storeName: string | null;
}

// ============================================================================
// Device Pairing Types (migration 028)
// ============================================================================

/**
 * Device role - what the device does in the salon
 * - store-app: Main checkout station (runs on desktop/tablet)
 * - mango-pad: Customer-facing iPad for signatures and tips
 * - check-in: Walk-in registration kiosk
 * - display: Waiting room display
 */
export type SalonDeviceRole = 'store-app' | 'mango-pad' | 'check-in' | 'display';

/**
 * Platform type - what hardware/OS the device runs on
 */
export type SalonDeviceType = 'ios' | 'android' | 'web' | 'desktop';

/**
 * Salon device record from Supabase
 */
export interface SalonDevice {
  id: string;
  store_id: string;
  device_fingerprint: string;
  device_name: string | null;
  device_type: SalonDeviceType;
  device_role: SalonDeviceRole | null;
  mqtt_client_id: string | null;
  local_ip: string | null;
  mqtt_port: number;
  is_hub: boolean;
  is_online: boolean;
  last_seen_at: string;
  // Device pairing fields
  station_name: string | null;
  pairing_code: string | null;
  paired_to_device_id: string | null;
  capabilities: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Pairing info stored in localStorage after successful pairing
 */
export interface PairingInfo {
  stationId: string;        // device_fingerprint of the paired Store App station
  salonId: string;          // store_id (salon/store)
  stationName: string;      // Human-readable station name
  deviceId: string;         // This Mango Pad's device_fingerprint
  pairedAt: string;         // ISO timestamp of pairing
}

/**
 * QR code payload for pairing
 */
export interface PairingQRPayload {
  type: 'mango-pad-pairing';
  stationId: string;        // device_fingerprint of Store App station
  pairingCode: string;      // 6-char pairing code
  salonId: string;          // store_id
  brokerUrl: string;        // MQTT broker URL
}
