/**
 * Mango Pad Configuration Constants
 */

export const PAD_CONFIG = {
  /** Heartbeat interval in milliseconds (15 seconds) */
  HEARTBEAT_INTERVAL_MS: 15_000,
  /** POS connection timeout in milliseconds (30 seconds without heartbeat) */
  POS_OFFLINE_TIMEOUT_MS: 30_000,
  /** Device name for this Pad */
  DEVICE_NAME: 'Mango Pad',
  /** App version */
  VERSION: '0.1.0',
} as const;

/** Get the salon ID from environment or fallback */
export function getSalonId(): string {
  return import.meta.env.VITE_SALON_ID || 'demo-salon';
}

/** Get the device ID (unique per Pad) */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('mango_pad_device_id');
  if (!deviceId) {
    deviceId = `pad-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem('mango_pad_device_id', deviceId);
  }
  return deviceId;
}

/** Get MQTT broker URL */
export function getMqttBrokerUrl(): string {
  return import.meta.env.VITE_MQTT_BROKER_URL || 'wss://mqtt.mango.com:8884';
}
