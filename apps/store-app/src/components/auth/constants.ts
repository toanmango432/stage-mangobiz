/**
 * Auth Module Constants
 *
 * Centralized constants for authentication messages and timeouts.
 * All auth components should import from this file instead of using hardcoded values.
 */

// ============================================================================
// TIMEOUT CONSTANTS (in milliseconds)
// ============================================================================

export const AUTH_TIMEOUTS = {
  /** Time to display success message before closing modal */
  SUCCESS_DISPLAY_MS: 1200,
  /** Time to display success message in PinVerificationModal */
  VERIFICATION_SUCCESS_MS: 800,
  /** Delay before auto-submitting PIN */
  PIN_AUTO_SUBMIT_DELAY_MS: 100,
  /** Card reader input timeout - keys faster than this are likely card reader */
  CARD_INPUT_TIMEOUT_MS: 100,
  /** Timeout for card reader buffer processing */
  CARD_BUFFER_TIMEOUT_MS: 300,
  /** Minimum card data length to consider valid */
  CARD_MIN_LENGTH: 4,
  /** Lockout countdown interval */
  LOCKOUT_COUNTDOWN_INTERVAL_MS: 1000,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const AUTH_MESSAGES = {
  // PIN Setup Messages
  PIN_FORMAT_ERROR: 'PIN must be 4-6 digits',
  PIN_MISMATCH_ERROR: "PINs don't match. Please try again.",
  PIN_SET_FAILED: 'Failed to set PIN. Please try again.',
  PIN_SET_SUCCESS: 'PIN Set Successfully',
  PIN_SET_SUCCESS_DETAIL: 'You can now use your PIN for quick access.',
  PIN_SETUP_REQUIRED: 'A PIN is required to continue.',
  PIN_SETUP_OPTIONAL: 'Quick access to your account on this device.',
  PIN_SETUP_REQUIRED_FOOTER: 'PIN setup is required to continue.',
  PIN_MIN_LENGTH_ERROR: 'Please enter your 4-digit PIN',
  PIN_INVALID_ERROR: 'Invalid PIN. Please try again.',
  PIN_VERIFICATION_FAILED: 'PIN verification failed.',

  // PIN Lockout Messages
  PIN_LOCKED: 'PIN Locked',
  PIN_LOCKED_DETAIL: 'Too many failed attempts.',
  PIN_LOCKED_TRY_AGAIN: (minutes: number) => `PIN locked. Try again in ${minutes} minutes.`,

  // Verification Messages
  VERIFICATION_SUCCESS: 'Verified',
  VERIFYING: 'Verifying...',
  VERIFICATION_FAILED: 'Verification failed. Please try again.',

  // Store Login Messages
  STORE_ID_REQUIRED: 'Please enter your Store ID',
  PASSWORD_REQUIRED: 'Please enter your password',
  EMAIL_REQUIRED: 'Please enter your email',
  LOGIN_SUCCESS: 'Login successful!',
  LOGIN_OFFLINE_SUCCESS: 'Logged in (offline mode).',
  LOGIN_FAILED: 'Login failed. Please check your credentials.',
  CONNECTION_ERROR: 'Unable to connect. Please check your connection and try again.',
  OFFLINE_FIRST_LOGIN: 'Connect to the internet for first login. Once logged in, you can use PIN for offline access.',

  // Member/Store Access Messages
  NO_STORE_ACCESS: 'No store access assigned to this account',
  STORE_DETAILS_ERROR: 'Could not load store details',
  STORE_NOT_CONNECTED: 'Store not connected',

  // Card Scan Messages
  CARD_READING: 'Reading card...',
  CARD_SCAN_PROMPT: 'or scan staff card',
  CARD_NOT_RECOGNIZED: 'Card not recognized',

  // Help Messages
  FORGOT_PIN: 'Forgot PIN?',
  FORGOT_PIN_HELP: 'Contact your administrator to reset your PIN.',
  CONTACT_ADMIN: 'Please contact your administrator for assistance.',

  // Modal Titles
  VERIFY_IDENTITY_TITLE: 'Verify Identity',
  PIN_SETUP_TITLE: 'Set Up Your PIN',
  SUCCESS_TITLE: 'Success',

  // Generic Labels
  STAFF_MEMBER: 'Staff Member',
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const AUTH_STORAGE_KEYS = {
  /** Prefix for PIN setup skip preference */
  PIN_SETUP_SKIPPED_PREFIX: 'pin_setup_skipped_',
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const AUTH_VALIDATION = {
  /** Minimum PIN length */
  PIN_MIN_LENGTH: 4,
  /** Maximum PIN length */
  PIN_MAX_LENGTH: 6,
  /** Maximum failed PIN attempts before lockout */
  PIN_MAX_ATTEMPTS: 5,
  /** Lockout duration in minutes */
  PIN_LOCKOUT_MINUTES: 15,
} as const;
