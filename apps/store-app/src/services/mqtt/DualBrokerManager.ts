/**
 * Dual Broker Manager
 * Manages local/cloud MQTT broker failover with automatic switching
 *
 * Strategy:
 * 1. Try local broker first (2-10ms latency)
 * 2. Fall back to cloud broker if local unavailable (30-80ms latency)
 * 3. Periodically check if local broker becomes available
 * 4. Switch back to local when it comes online
 *
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import { supabase } from '../supabase/client';
import type { MqttConfig, MqttConnectionInfo, MqttBrokerType } from './types';
import { MqttClient, getMqttClient } from './MqttClient';
import { getCloudBrokerUrl } from './featureFlags';

// =============================================================================
// Constants
// =============================================================================

const LOCAL_CONNECT_TIMEOUT = 3000; // 3 seconds for local
const CLOUD_CONNECT_TIMEOUT = 10000; // 10 seconds for cloud
const LOCAL_CHECK_INTERVAL = 120000; // Check for local every 2 minutes (was 30 seconds - reduced to fix performance)
const DISCOVERY_CACHE_TTL = 60000; // Cache discovery for 1 minute

// =============================================================================
// Types
// =============================================================================

interface LocalBrokerInfo {
  deviceId: string;
  localIp: string;
  mqttPort: number;
  lastSeen: Date;
}

interface BrokerDiscoveryResult {
  localBroker: LocalBrokerInfo | null;
  cloudBrokerUrl: string;
  timestamp: Date;
}

// =============================================================================
// Dual Broker Manager Class
// =============================================================================

export class DualBrokerManager {
  private client: MqttClient;
  private config: MqttConfig | null = null;
  private localBrokerInfo: LocalBrokerInfo | null = null;
  private discoveryCache: BrokerDiscoveryResult | null = null;
  private localCheckInterval: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;

  constructor(client?: MqttClient) {
    this.client = client ?? getMqttClient();
  }

  // =============================================================================
  // Connection
  // =============================================================================

  /**
   * Connect to the best available broker
   * Tries local first, then falls back to cloud
   */
  async connect(config: MqttConfig): Promise<boolean> {
    if (this.isConnecting) {
      console.warn('[DualBroker] Connection already in progress');
      return false;
    }

    this.isConnecting = true;
    this.config = config;

    try {
      // Discover available brokers
      const discovery = await this.discoverBrokers(config.storeId);

      // Try local broker first
      if (discovery.localBroker) {
        const localUrl = this.buildLocalUrl(discovery.localBroker);
        console.log('[DualBroker] Trying local broker:', localUrl);

        const localSuccess = await this.tryConnect(
          localUrl,
          config,
          'local',
          LOCAL_CONNECT_TIMEOUT
        );

        if (localSuccess) {
          console.log('[DualBroker] Connected to local broker');
          this.localBrokerInfo = discovery.localBroker;
          this.startLocalMonitor();
          return true;
        }

        console.warn('[DualBroker] Local broker failed, trying cloud...');
      }

      // Fall back to cloud broker
      console.log('[DualBroker] Trying cloud broker:', discovery.cloudBrokerUrl);
      const cloudSuccess = await this.tryConnect(
        discovery.cloudBrokerUrl,
        config,
        'cloud',
        CLOUD_CONNECT_TIMEOUT
      );

      if (cloudSuccess) {
        console.log('[DualBroker] Connected to cloud broker');
        this.startLocalMonitor(); // Keep checking for local
        return true;
      }

      console.error('[DualBroker] Failed to connect to any broker');
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Try to connect to a specific broker with timeout
   */
  private async tryConnect(
    url: string,
    config: MqttConfig,
    brokerType: MqttBrokerType,
    timeout: number
  ): Promise<boolean> {
    const configWithTimeout: MqttConfig = {
      ...config,
      connectTimeout: timeout,
      reconnectPeriod: 0, // Disable auto-reconnect for initial attempt
    };

    return this.client.connect(url, configWithTimeout, brokerType);
  }

  /**
   * Disconnect from current broker
   */
  async disconnect(): Promise<void> {
    this.stopLocalMonitor();
    await this.client.disconnect();
    this.config = null;
    this.localBrokerInfo = null;
  }

  // =============================================================================
  // Broker Discovery
  // =============================================================================

  /**
   * Discover available brokers for a store
   * Uses Supabase salon_devices table to find local hub
   */
  private async discoverBrokers(storeId: string): Promise<BrokerDiscoveryResult> {
    // Check cache first
    if (
      this.discoveryCache &&
      Date.now() - this.discoveryCache.timestamp.getTime() < DISCOVERY_CACHE_TTL
    ) {
      return this.discoveryCache;
    }

    const cloudBrokerUrl = getCloudBrokerUrl();
    let localBroker: LocalBrokerInfo | null = null;

    try {
      // Query for hub device (Store App running Mosquitto)
      const { data, error } = await supabase
        .from('salon_devices')
        .select('device_fingerprint, local_ip, mqtt_port, last_seen_at')
        .eq('store_id', storeId)
        .eq('is_hub', true)
        .eq('is_online', true)
        .order('last_seen_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data && data.local_ip) {
        // Check if hub was seen recently (within 2 minutes)
        const lastSeen = new Date(data.last_seen_at);
        const isRecent = Date.now() - lastSeen.getTime() < 2 * 60 * 1000;

        if (isRecent) {
          localBroker = {
            deviceId: data.device_fingerprint,
            localIp: data.local_ip,
            mqttPort: data.mqtt_port ?? 1883,
            lastSeen,
          };
        }
      }
    } catch (error) {
      console.warn('[DualBroker] Failed to discover local broker:', error);
    }

    const result: BrokerDiscoveryResult = {
      localBroker,
      cloudBrokerUrl,
      timestamp: new Date(),
    };

    this.discoveryCache = result;
    return result;
  }

  /**
   * Build WebSocket URL for local broker
   */
  private buildLocalUrl(info: LocalBrokerInfo): string {
    // Use WebSocket for browser compatibility
    return `ws://${info.localIp}:${info.mqttPort}`;
  }

  // =============================================================================
  // Local Broker Monitor
  // =============================================================================

  /**
   * Start monitoring for local broker availability
   * Switches from cloud to local when local becomes available
   */
  private startLocalMonitor(): void {
    this.stopLocalMonitor();

    this.localCheckInterval = setInterval(async () => {
      await this.checkLocalBroker();
    }, LOCAL_CHECK_INTERVAL);
  }

  /**
   * Stop local broker monitor
   */
  private stopLocalMonitor(): void {
    if (this.localCheckInterval) {
      clearInterval(this.localCheckInterval);
      this.localCheckInterval = null;
    }
  }

  /**
   * Check if local broker is available and switch if needed
   */
  private async checkLocalBroker(): Promise<void> {
    if (!this.config) return;

    const currentBrokerType = this.client.getBrokerType();

    // If already on local, verify it's still working
    if (currentBrokerType === 'local') {
      if (!this.client.isConnected()) {
        console.log('[DualBroker] Local broker disconnected, reconnecting...');
        await this.connect(this.config);
      }
      return;
    }

    // If on cloud, check if local is now available
    if (currentBrokerType === 'cloud') {
      // Clear discovery cache to force fresh lookup
      this.discoveryCache = null;

      const discovery = await this.discoverBrokers(this.config.storeId);

      if (discovery.localBroker) {
        console.log('[DualBroker] Local broker available, switching...');
        const localUrl = this.buildLocalUrl(discovery.localBroker);

        const success = await this.tryConnect(
          localUrl,
          this.config,
          'local',
          LOCAL_CONNECT_TIMEOUT
        );

        if (success) {
          console.log('[DualBroker] Switched to local broker');
          this.localBrokerInfo = discovery.localBroker;
        }
      }
    }
  }

  // =============================================================================
  // Status
  // =============================================================================

  /**
   * Get current connection info
   */
  getConnectionInfo(): MqttConnectionInfo {
    return this.client.getConnectionInfo();
  }

  /**
   * Check if connected to any broker
   */
  isConnected(): boolean {
    return this.client.isConnected();
  }

  /**
   * Get current broker type
   */
  getBrokerType(): MqttBrokerType | null {
    return this.client.getBrokerType();
  }

  /**
   * Get local broker info if available
   */
  getLocalBrokerInfo(): LocalBrokerInfo | null {
    return this.localBrokerInfo;
  }

  /**
   * Force switch to cloud broker
   * Useful if local is having issues
   */
  async switchToCloud(): Promise<boolean> {
    if (!this.config) {
      console.warn('[DualBroker] No config, cannot switch');
      return false;
    }

    const cloudUrl = getCloudBrokerUrl();
    console.log('[DualBroker] Forcing switch to cloud:', cloudUrl);

    return this.tryConnect(cloudUrl, this.config, 'cloud', CLOUD_CONNECT_TIMEOUT);
  }

  /**
   * Force rediscovery of local broker
   */
  async rediscoverLocal(): Promise<void> {
    this.discoveryCache = null;
    await this.checkLocalBroker();
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  /**
   * Destroy the manager and cleanup resources
   */
  destroy(): void {
    this.stopLocalMonitor();
    this.discoveryCache = null;
    this.config = null;
    this.localBrokerInfo = null;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let instance: DualBrokerManager | null = null;

/**
 * Get the Dual Broker Manager singleton instance
 */
export function getDualBrokerManager(): DualBrokerManager {
  if (!instance) {
    instance = new DualBrokerManager();
  }
  return instance;
}

/**
 * Destroy the Dual Broker Manager singleton
 */
export function destroyDualBrokerManager(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
