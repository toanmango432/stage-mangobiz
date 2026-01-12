/**
 * App Constants
 *
 * Static values used throughout the Check-In app.
 */

// Timeouts
export const IDLE_TIMEOUT_MS = 60000; // 60 seconds
export const IDLE_WARNING_MS = 45000; // 45 seconds warning
export const SUCCESS_REDIRECT_MS = 10000; // 10 seconds auto-reset after success

// Limits
export const MAX_GUESTS = 6;
export const PHONE_LENGTH = 10;

// Queue
export const BUSY_WAIT_THRESHOLD_MINUTES = 45; // Show warning when wait exceeds this

// MQTT Topics (templates - replace {storeId} at runtime)
export const MQTT_TOPICS = {
  CHECKIN_NEW: 'salon/{storeId}/checkin/new',
  CHECKIN_UPDATE: 'salon/{storeId}/checkin/update',
  QUEUE_STATUS: 'salon/{storeId}/queue/status',
  STAFF_STATUS: 'salon/{storeId}/staff/status',
  CHECKIN_CALLED: 'salon/{storeId}/checkin/called',
} as const;

// Colors (for programmatic use - prefer Tailwind classes)
export const COLORS = {
  primary: '#1a5f4a',
  primaryDark: '#154d3c',
  accent: '#d4a853',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// Technician status labels
export const TECHNICIAN_STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  with_client: 'With Client',
  on_break: 'On Break',
  unavailable: 'Unavailable',
};

// Technician status colors (Tailwind classes)
export const TECHNICIAN_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-500',
  with_client: 'bg-yellow-500',
  on_break: 'bg-gray-400',
  unavailable: 'bg-red-500',
};
