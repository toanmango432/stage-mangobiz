/**
 * Network Monitor Service
 * Monitors network interfaces for IP address changes
 *
 * Part of: MQTT Architecture Implementation (Phase 2)
 */

import { networkInterfaces, NetworkInterfaceInfo } from 'os';
import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface NetworkInfo {
  ip: string;
  interface: string;
  family: 'IPv4' | 'IPv6';
  internal: boolean;
  mac: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_POLL_INTERVAL_MS = 10000; // 10 seconds
const PREFERRED_INTERFACES = ['en0', 'eth0', 'wlan0', 'Ethernet', 'Wi-Fi'];

// =============================================================================
// NetworkMonitor Class
// =============================================================================

export class NetworkMonitor extends EventEmitter {
  private currentIp: string | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private pollIntervalMs: number;

  constructor(pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS) {
    super();
    this.pollIntervalMs = pollIntervalMs;
  }

  // ===========================================================================
  // IP Detection
  // ===========================================================================

  /**
   * Get all network interfaces with IPv4 addresses
   */
  private getNetworkInterfaces(): NetworkInfo[] {
    const interfaces = networkInterfaces();
    const results: NetworkInfo[] = [];

    for (const [name, addresses] of Object.entries(interfaces)) {
      if (!addresses) continue;

      for (const addr of addresses) {
        // Skip internal and IPv6 addresses
        if (addr.internal) continue;
        if (addr.family !== 'IPv4') continue;

        results.push({
          ip: addr.address,
          interface: name,
          family: addr.family as 'IPv4' | 'IPv6',
          internal: addr.internal,
          mac: addr.mac,
        });
      }
    }

    return results;
  }

  /**
   * Get the primary local IP address
   * Prefers certain interfaces (en0, eth0, etc.) for consistency
   */
  private getPrimaryIp(): string | null {
    const interfaces = this.getNetworkInterfaces();

    if (interfaces.length === 0) {
      return null;
    }

    // Try to find a preferred interface
    for (const preferred of PREFERRED_INTERFACES) {
      const match = interfaces.find((i) =>
        i.interface.toLowerCase().includes(preferred.toLowerCase())
      );
      if (match) {
        return match.ip;
      }
    }

    // Fall back to first non-internal IPv4 address
    return interfaces[0]?.ip || null;
  }

  // ===========================================================================
  // Monitoring
  // ===========================================================================

  /**
   * Start monitoring for IP changes
   */
  start(): void {
    if (this.pollInterval) {
      console.log('[NetworkMonitor] Already running');
      return;
    }

    // Get initial IP
    this.currentIp = this.getPrimaryIp();
    console.log('[NetworkMonitor] Initial IP:', this.currentIp);

    // Start polling for changes
    this.pollInterval = setInterval(() => {
      this.checkForChanges();
    }, this.pollIntervalMs);

    console.log(
      `[NetworkMonitor] Started with ${this.pollIntervalMs}ms interval`
    );
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('[NetworkMonitor] Stopped');
    }
  }

  /**
   * Check for IP address changes
   */
  private checkForChanges(): void {
    const newIp = this.getPrimaryIp();

    if (newIp !== this.currentIp) {
      const oldIp = this.currentIp;
      this.currentIp = newIp;

      console.log(`[NetworkMonitor] IP changed: ${oldIp} -> ${newIp}`);
      this.emit('ip-changed', newIp, oldIp);
    }
  }

  // ===========================================================================
  // Status Methods
  // ===========================================================================

  /**
   * Get the current IP address
   */
  getCurrentIp(): string | null {
    return this.currentIp;
  }

  /**
   * Get all network interfaces
   */
  getAllInterfaces(): NetworkInfo[] {
    return this.getNetworkInterfaces();
  }

  /**
   * Force a refresh of the current IP
   */
  refresh(): string | null {
    this.currentIp = this.getPrimaryIp();
    return this.currentIp;
  }

  /**
   * Check if monitoring is active
   */
  isRunning(): boolean {
    return this.pollInterval !== null;
  }
}

export default NetworkMonitor;
