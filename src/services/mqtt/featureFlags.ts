/**
 * MQTT Feature Flags
 * Environment-based feature toggles for gradual MQTT rollout
 *
 * Part of: MQTT Architecture Implementation (Phase 0)
 */

// =============================================================================
// Environment Variables
// =============================================================================

/**
 * Check if MQTT is enabled globally
 * Set VITE_USE_MQTT=true to enable
 */
export function isMqttEnabled(): boolean {
  return import.meta.env.VITE_USE_MQTT === 'true';
}

/**
 * Get the cloud MQTT broker URL
 */
export function getCloudBrokerUrl(): string {
  return (
    import.meta.env.VITE_MQTT_CLOUD_URL || 'mqtts://mqtt.mango.cloud:8883'
  );
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true || import.meta.env.VITE_DEV_MODE === 'true';
}

// =============================================================================
// Feature-Specific Flags
// =============================================================================

/**
 * Feature flags for gradual MQTT rollout
 * Each feature can be enabled/disabled independently
 */
export interface MqttFeatureFlags {
  /** Use MQTT for device presence (Phase 3, Week 9) */
  devicePresence: boolean;
  /** Use MQTT for signature capture (Phase 3, Week 10) */
  signatures: boolean;
  /** Use MQTT for check-ins (Phase 3, Week 10) */
  checkIns: boolean;
  /** Use MQTT for appointment updates (Phase 3, Week 10) */
  appointments: boolean;
  /** Use MQTT for ticket updates (Phase 3, Week 10) */
  tickets: boolean;
  /** Use MQTT for payments (Phase 3, after validation) */
  payments: boolean;
  /** Use MQTT for waitlist updates (non-critical) */
  waitlist: boolean;
  /** Use MQTT for online bookings (Phase 5) */
  onlineBookings: boolean;
}

/**
 * Get current feature flags
 * In Phase 0-2, all features default to false
 * In Phase 3+, features are enabled gradually
 */
export function getMqttFeatureFlags(): MqttFeatureFlags {
  // If MQTT is disabled globally, all features are off
  if (!isMqttEnabled()) {
    return {
      devicePresence: false,
      signatures: false,
      checkIns: false,
      appointments: false,
      tickets: false,
      payments: false,
      waitlist: false,
      onlineBookings: false,
    };
  }

  // Read individual feature flags from environment
  // These can be set per-environment for gradual rollout
  return {
    devicePresence:
      import.meta.env.VITE_MQTT_FEATURE_DEVICE_PRESENCE !== 'false',
    signatures: import.meta.env.VITE_MQTT_FEATURE_SIGNATURES !== 'false',
    checkIns: import.meta.env.VITE_MQTT_FEATURE_CHECKINS !== 'false',
    appointments: import.meta.env.VITE_MQTT_FEATURE_APPOINTMENTS !== 'false',
    tickets: import.meta.env.VITE_MQTT_FEATURE_TICKETS !== 'false',
    payments: import.meta.env.VITE_MQTT_FEATURE_PAYMENTS === 'true', // Opt-in for payments
    waitlist: import.meta.env.VITE_MQTT_FEATURE_WAITLIST !== 'false',
    onlineBookings:
      import.meta.env.VITE_MQTT_FEATURE_ONLINE_BOOKINGS === 'true', // Opt-in for online bookings
  };
}

/**
 * Check if a specific MQTT feature is enabled
 */
export function isMqttFeatureEnabled(
  feature: keyof MqttFeatureFlags
): boolean {
  const flags = getMqttFeatureFlags();
  return flags[feature];
}

// =============================================================================
// Migration Helpers
// =============================================================================

/**
 * Migration phase constants
 * Used for logging and debugging during gradual rollout
 */
export const MQTT_MIGRATION_PHASE = {
  PHASE_0_FOUNDATION: 0,
  PHASE_1_CLIENT_LIBRARY: 1,
  PHASE_2_ELECTRON: 2,
  PHASE_3_INTEGRATION: 3,
  PHASE_4_MONOREPO: 4,
  PHASE_5_SATELLITE_APPS: 5,
  PHASE_6_CLEANUP: 6,
} as const;

/**
 * Get current migration phase based on enabled features
 * Useful for conditional logic during migration
 */
export function getCurrentMigrationPhase(): number {
  if (!isMqttEnabled()) {
    return MQTT_MIGRATION_PHASE.PHASE_0_FOUNDATION;
  }

  const flags = getMqttFeatureFlags();

  // Phase 6: All features including payments
  if (flags.payments && flags.onlineBookings) {
    return MQTT_MIGRATION_PHASE.PHASE_6_CLEANUP;
  }

  // Phase 5: Online bookings enabled
  if (flags.onlineBookings) {
    return MQTT_MIGRATION_PHASE.PHASE_5_SATELLITE_APPS;
  }

  // Phase 3+: Core features enabled
  if (flags.signatures && flags.checkIns) {
    return MQTT_MIGRATION_PHASE.PHASE_3_INTEGRATION;
  }

  // Phase 3 start: Device presence enabled
  if (flags.devicePresence) {
    return MQTT_MIGRATION_PHASE.PHASE_3_INTEGRATION;
  }

  // Phase 1-2: MQTT enabled but no features
  return MQTT_MIGRATION_PHASE.PHASE_1_CLIENT_LIBRARY;
}

// =============================================================================
// Logging Helpers
// =============================================================================

/**
 * Log MQTT feature status (useful for debugging)
 */
export function logMqttStatus(): void {
  const enabled = isMqttEnabled();
  const flags = getMqttFeatureFlags();
  const phase = getCurrentMigrationPhase();

  console.group('[MQTT] Feature Status');
  console.log('MQTT Enabled:', enabled);
  console.log('Migration Phase:', phase);
  console.log('Cloud Broker:', getCloudBrokerUrl());
  console.log('Feature Flags:', flags);
  console.groupEnd();
}
