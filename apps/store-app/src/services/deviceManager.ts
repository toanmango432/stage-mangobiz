/**
 * Device Manager Service
 *
 * Handles device identification, fingerprinting, and registration.
 * This service manages the device identity used for offline mode tracking.
 * Supports both web and native (Capacitor) platforms.
 */

import { Capacitor } from '@capacitor/core';
import { DeviceType, DeviceRegistration, DeviceMode } from '@/types/device';

// Storage key for device ID
const DEVICE_ID_KEY = 'mango_device_id';
const DEVICE_NAME_KEY = 'mango_device_name';
const MQTT_CLIENT_ID_KEY = 'mango_mqtt_client_id';

/**
 * Manages device identification and fingerprinting.
 */
class DeviceManager {
  private cachedFingerprint: string | null = null;

  // ==================== DEVICE ID ====================

  /**
   * Get or create a stable device identifier.
   * Uses localStorage for persistence across sessions.
   */
  getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  /**
   * Generate a unique device ID using crypto API.
   */
  private generateDeviceId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Clear device identity (used when device is revoked).
   */
  clearDeviceId(): void {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(DEVICE_NAME_KEY);
    localStorage.removeItem(MQTT_CLIENT_ID_KEY);
    this.cachedFingerprint = null;
  }

  // ==================== DEVICE NAME ====================

  /**
   * Get stored device name (user-provided).
   */
  getDeviceName(): string | null {
    return localStorage.getItem(DEVICE_NAME_KEY);
  }

  /**
   * Store device name for future logins.
   */
  setDeviceName(name: string): void {
    localStorage.setItem(DEVICE_NAME_KEY, name);
  }

  // ==================== FINGERPRINTING ====================

  /**
   * Generate a fingerprint from device characteristics.
   * Used as secondary identifier for device matching.
   */
  async getFingerprint(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    const components = await this.collectFingerprintComponents();
    const data = components.join('|');
    const hash = await this.sha256(data);

    this.cachedFingerprint = hash;
    return hash;
  }

  /**
   * Collect various browser/device characteristics for fingerprinting.
   */
  private async collectFingerprintComponents(): Promise<string[]> {
    const components: string[] = [];

    // Basic browser info
    components.push(navigator.userAgent);
    components.push(navigator.language);
    components.push(`${screen.width}x${screen.height}`);
    components.push(`${screen.colorDepth}`);
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // Hardware info
    components.push(navigator.hardwareConcurrency?.toString() || 'unknown');
    components.push(navigator.maxTouchPoints?.toString() || '0');
    components.push((navigator as any).deviceMemory?.toString() || 'unknown');

    // Platform info
    components.push(navigator.platform || 'unknown');

    // Canvas fingerprint (optional, for additional entropy)
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Mango POS', 2, 2);
        components.push(canvas.toDataURL().slice(-50));
      }
    } catch {
      components.push('canvas-unavailable');
    }

    // WebGL renderer (optional)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown');
        }
      }
    } catch {
      components.push('webgl-unavailable');
    }

    return components;
  }

  /**
   * SHA-256 hash function.
   */
  private async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ==================== PLATFORM DETECTION ====================

  /**
   * Check if running inside a native Capacitor app (iOS/Android).
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check if running inside Capacitor (native or web).
   * Returns true for both native apps and when running in browser during Capacitor development.
   */
  isCapacitor(): boolean {
    return Capacitor.isPluginAvailable('App');
  }

  /**
   * Get the Capacitor platform string.
   * Returns 'ios', 'android', or 'web'.
   */
  getCapacitorPlatform(): 'ios' | 'android' | 'web' {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  }

  // ==================== DEVICE TYPE DETECTION ====================

  /**
   * Detect the device type.
   * Prioritizes Capacitor detection for native apps, falls back to user agent.
   */
  getDeviceType(): DeviceType {
    // Capacitor native platform detection (most reliable for native apps)
    if (this.isNative()) {
      const platform = this.getCapacitorPlatform();
      if (platform === 'ios') return 'ios';
      if (platform === 'android') return 'android';
    }

    const ua = navigator.userAgent.toLowerCase();

    // Check for Electron (desktop app) - has higher priority than mobile detection
    // because Electron on macOS also matches iOS patterns
    if (/electron/.test(ua)) {
      return 'desktop';
    }

    // Check for iOS devices (web browser, not Capacitor native)
    if (/ipad|iphone|ipod/.test(ua)) {
      return 'ios';
    }

    // Check for Android (web browser, not Capacitor native)
    if (/android/.test(ua)) {
      return 'android';
    }

    // Default to web
    return 'web';
  }

  /**
   * Get browser name from user agent.
   */
  getBrowser(): string {
    const ua = navigator.userAgent;

    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('SamsungBrowser')) return 'Samsung Browser';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';

    return 'Unknown';
  }

  /**
   * Get OS name from user agent.
   */
  getOS(): string {
    const ua = navigator.userAgent;

    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';

    return 'Unknown';
  }

  // ==================== REGISTRATION PAYLOAD ====================

  /**
   * Build registration payload for login.
   */
  async buildRegistration(
    deviceName?: string,
    requestedMode?: DeviceMode
  ): Promise<DeviceRegistration> {
    const fingerprint = await this.getFingerprint();

    return {
      deviceFingerprint: fingerprint,
      deviceName: deviceName || this.getDeviceName() || undefined,
      deviceType: this.getDeviceType(),
      userAgent: navigator.userAgent,
      browser: this.getBrowser(),
      os: this.getOS(),
      requestedMode,
    };
  }

  // ==================== UTILITY ====================

  /**
   * Check if this is likely a mobile device.
   */
  isMobile(): boolean {
    return this.getDeviceType() === 'ios' || this.getDeviceType() === 'android';
  }

  /**
   * Check if this device has touch support.
   */
  hasTouch(): boolean {
    return navigator.maxTouchPoints > 0;
  }

  /**
   * Get a friendly device description.
   */
  getDeviceDescription(): string {
    const type = this.getDeviceType();
    const browser = this.getBrowser();
    const os = this.getOS();

    return `${browser} on ${os} (${type})`;
  }

  // ==================== MQTT SUPPORT (Phase 3) ====================

  /**
   * Get or create a stable MQTT client ID.
   * Format: mango-{deviceType}-{shortId}
   */
  getMqttClientId(): string {
    let clientId = localStorage.getItem(MQTT_CLIENT_ID_KEY);
    if (!clientId) {
      const deviceId = this.getDeviceId();
      const deviceType = this.getDeviceType();
      clientId = `mango-${deviceType}-${deviceId.substring(0, 8)}`;
      localStorage.setItem(MQTT_CLIENT_ID_KEY, clientId);
    }
    return clientId;
  }

  /**
   * Build MQTT connection config for this device.
   */
  getMqttConfig(storeId: string): {
    storeId: string;
    deviceId: string;
    deviceType: DeviceType;
    mqttClientId: string;
    deviceName: string;
  } {
    return {
      storeId,
      deviceId: this.getDeviceId(),
      deviceType: this.getDeviceType(),
      mqttClientId: this.getMqttClientId(),
      deviceName: this.getDeviceName() || this.getDeviceDescription(),
    };
  }

  /**
   * Check if this device should act as an MQTT hub.
   * Only desktop (Electron) devices can be hubs as they run Mosquitto.
   */
  canBeHub(): boolean {
    return this.getDeviceType() === 'desktop';
  }

  /**
   * Clear MQTT client ID (used when device is revoked).
   */
  clearMqttClientId(): void {
    localStorage.removeItem(MQTT_CLIENT_ID_KEY);
  }
}

// Export singleton instance
export const deviceManager = new DeviceManager();
