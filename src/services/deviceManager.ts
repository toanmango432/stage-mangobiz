/**
 * Device Manager Service
 *
 * Handles device identification, fingerprinting, and registration.
 * This service manages the device identity used for offline mode tracking.
 */

import { DeviceType, DeviceRegistration, DeviceMode } from '@/types/device';

// Storage key for device ID
const DEVICE_ID_KEY = 'mango_device_id';
const DEVICE_NAME_KEY = 'mango_device_name';

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
    components.push(navigator.deviceMemory?.toString() || 'unknown');

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

  // ==================== DEVICE TYPE DETECTION ====================

  /**
   * Detect the device type based on user agent.
   */
  getDeviceType(): DeviceType {
    const ua = navigator.userAgent.toLowerCase();

    // Check for iOS devices
    if (/ipad|iphone|ipod/.test(ua)) {
      return 'ios';
    }

    // Check for Android
    if (/android/.test(ua)) {
      return 'android';
    }

    // Check for Electron (desktop app)
    if (/electron/.test(ua)) {
      return 'desktop';
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
}

// Export singleton instance
export const deviceManager = new DeviceManager();
