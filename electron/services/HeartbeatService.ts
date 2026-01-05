/**
 * Heartbeat Service
 * Sends periodic heartbeats to Supabase to register device presence
 *
 * Part of: MQTT Architecture Implementation (Phase 2)
 */

import { EventEmitter } from 'events';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import machineId from 'node-machine-id';
import { hostname } from 'os';

const { machineIdSync } = machineId;

// =============================================================================
// Types
// =============================================================================

export interface HeartbeatConfig {
  localIp: string | null;
  mqttPort: number;
  isHub: boolean;
  intervalMs?: number;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface DeviceRegistration {
  id?: string;
  store_id: string;
  device_fingerprint: string;
  device_name: string;
  device_type: 'desktop';
  mqtt_client_id: string;
  local_ip: string | null;
  mqtt_port: number;
  is_hub: boolean;
  is_online: boolean;
  last_seen_at: string;
  capabilities: Record<string, boolean>;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
// Use actual Supabase credentials - these should match .env
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://cpaldkcvdcdyzytosntc.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYWxka2N2ZGNkeXp5dG9zbnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODMzNzIsImV4cCI6MjA3OTY1OTM3Mn0.A4tG6cf7Xk5Y0eGE-Wpx5-gX62neCnuD2QlRxZ2qOOQ';

// =============================================================================
// HeartbeatService Class
// =============================================================================

export class HeartbeatService extends EventEmitter {
  private supabase: SupabaseClient;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private deviceFingerprint: string;
  private deviceName: string;
  private mqttClientId: string;
  private localIp: string | null;
  private mqttPort: number;
  private isHub: boolean;
  private intervalMs: number;
  private storeId: string | null = null;
  private deviceId: string | null = null;
  private isRegistered = false;

  constructor(config: HeartbeatConfig) {
    super();

    this.localIp = config.localIp;
    this.mqttPort = config.mqttPort;
    this.isHub = config.isHub;
    this.intervalMs = config.intervalMs || DEFAULT_HEARTBEAT_INTERVAL_MS;

    // Generate device identifiers
    this.deviceFingerprint = this.generateFingerprint();
    this.deviceName = `Mango POS - ${hostname()}`;
    this.mqttClientId = `mango-desktop-${this.deviceFingerprint.substring(0, 8)}`;

    // Initialize Supabase client
    this.supabase = createClient(
      config.supabaseUrl || SUPABASE_URL,
      config.supabaseAnonKey || SUPABASE_ANON_KEY
    );

    console.log('[HeartbeatService] Initialized with:', {
      deviceFingerprint: this.deviceFingerprint,
      deviceName: this.deviceName,
      mqttClientId: this.mqttClientId,
    });
  }

  // ===========================================================================
  // Device Identification
  // ===========================================================================

  /**
   * Generate a unique device fingerprint
   */
  private generateFingerprint(): string {
    try {
      return machineIdSync();
    } catch (error) {
      console.warn(
        '[HeartbeatService] Could not get machine ID, using fallback'
      );
      // Fallback to hostname-based ID
      return `${hostname()}-${process.platform}-${process.arch}`;
    }
  }

  // ===========================================================================
  // Registration
  // ===========================================================================

  /**
   * Register or update device in Supabase
   */
  private async registerDevice(): Promise<void> {
    if (!this.storeId) {
      console.log('[HeartbeatService] No store ID set, skipping registration');
      return;
    }

    const registration: DeviceRegistration = {
      store_id: this.storeId,
      device_fingerprint: this.deviceFingerprint,
      device_name: this.deviceName,
      device_type: 'desktop',
      mqtt_client_id: this.mqttClientId,
      local_ip: this.localIp,
      mqtt_port: this.mqttPort,
      is_hub: this.isHub,
      is_online: true,
      last_seen_at: new Date().toISOString(),
      capabilities: {
        mqtt_broker: this.isHub,
        offline_mode: true,
        tap_to_pay: false,
        receipt_printer: true,
        barcode_scanner: true,
      },
    };

    try {
      // Upsert device registration
      const { data, error } = await this.supabase
        .from('salon_devices')
        .upsert(registration, {
          onConflict: 'store_id,device_fingerprint',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      this.deviceId = data.id;
      this.isRegistered = true;

      console.log('[HeartbeatService] Device registered:', this.deviceId);
      this.emit('registered', data);
    } catch (error) {
      console.error('[HeartbeatService] Registration failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Send heartbeat to update last_seen_at
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.storeId || !this.isRegistered) {
      return;
    }

    try {
      const { error } = await this.supabase
        .from('salon_devices')
        .update({
          is_online: true,
          last_seen_at: new Date().toISOString(),
          local_ip: this.localIp,
          mqtt_port: this.mqttPort,
        })
        .eq('store_id', this.storeId)
        .eq('device_fingerprint', this.deviceFingerprint);

      if (error) {
        throw error;
      }

      this.emit('heartbeat', new Date());
    } catch (error) {
      console.error('[HeartbeatService] Heartbeat failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Mark device as offline
   */
  private async markOffline(): Promise<void> {
    if (!this.storeId || !this.isRegistered) {
      return;
    }

    try {
      const { error } = await this.supabase
        .from('salon_devices')
        .update({
          is_online: false,
          last_seen_at: new Date().toISOString(),
        })
        .eq('store_id', this.storeId)
        .eq('device_fingerprint', this.deviceFingerprint);

      if (error) {
        throw error;
      }

      console.log('[HeartbeatService] Marked device offline');
    } catch (error) {
      console.error('[HeartbeatService] Failed to mark offline:', error);
    }
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  /**
   * Start the heartbeat service
   */
  start(): void {
    if (this.heartbeatInterval) {
      console.log('[HeartbeatService] Already running');
      return;
    }

    // Initial registration
    this.registerDevice();

    // Start heartbeat interval
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.intervalMs);

    console.log(
      `[HeartbeatService] Started with ${this.intervalMs}ms interval`
    );
  }

  /**
   * Stop the heartbeat service
   */
  async stop(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Mark device as offline before stopping
    await this.markOffline();

    console.log('[HeartbeatService] Stopped');
  }

  // ===========================================================================
  // Configuration
  // ===========================================================================

  /**
   * Set the store ID (required for registration)
   */
  setStoreId(storeId: string): void {
    this.storeId = storeId;

    // Re-register if already started
    if (this.heartbeatInterval && !this.isRegistered) {
      this.registerDevice();
    }
  }

  /**
   * Update local IP address
   */
  updateLocalIp(newIp: string): void {
    this.localIp = newIp;
    console.log('[HeartbeatService] Local IP updated:', newIp);

    // Send immediate heartbeat with new IP
    if (this.isRegistered) {
      this.sendHeartbeat();
    }
  }

  /**
   * Update MQTT port
   */
  updateMqttPort(newPort: number): void {
    this.mqttPort = newPort;
    console.log('[HeartbeatService] MQTT port updated:', newPort);
  }

  // ===========================================================================
  // Status Methods
  // ===========================================================================

  /**
   * Get device fingerprint
   */
  getFingerprint(): string {
    return this.deviceFingerprint;
  }

  /**
   * Get MQTT client ID
   */
  getMqttClientId(): string {
    return this.mqttClientId;
  }

  /**
   * Check if device is registered
   */
  getIsRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Check if service is running
   */
  isRunning(): boolean {
    return this.heartbeatInterval !== null;
  }
}

export default HeartbeatService;
