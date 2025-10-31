/**
 * Appointment Module Constants
 * Centralized constants for better maintainability
 */

// ============================================================================
// VISUAL CONSTANTS (From jQuery Calendar)
// ============================================================================

/** Height in pixels for each 15-minute time slot */
export const PIXELS_PER_15_MINUTES = 22;

/** Time slot interval in minutes */
export const TIME_SLOT_INTERVAL = 15;

/** Time slot interval in seconds */
export const TIME_SLOT_INTERVAL_SECONDS = 900; // 15 * 60

/** 2-hour window offset in seconds */
export const TWO_HOUR_WINDOW_SECONDS = 7200; // 2 * 60 * 60

/** Working hours offset in seconds (for calculations) */
export const WORKING_HOURS_OFFSET = 7200;

// ============================================================================
// SPECIAL IDs
// ============================================================================

/** Special staff ID for "Next Available" technician */
export const NEXT_AVAILABLE_STAFF_ID = 9999;

/** Special staff ID for "Salon" (no specific tech) */
export const SALON_STAFF_ID = 9999;

// ============================================================================
// BUSINESS HOURS
// ============================================================================

/** Default business hours */
export const DEFAULT_BUSINESS_HOURS = {
  START_HOUR: 8,
  END_HOUR: 20,
  START_TIME: '08:00 AM',
  END_TIME: '08:00 PM',
} as const;

// ============================================================================
// DEBOUNCE TIMINGS
// ============================================================================

/** Customer search debounce in milliseconds */
export const CUSTOMER_SEARCH_DEBOUNCE_MS = 300;

/** General input debounce in milliseconds */
export const INPUT_DEBOUNCE_MS = 300;

// ============================================================================
// APPOINTMENT STATUS
// ============================================================================

export const APPOINTMENT_CONFIRMATION = {
  AUTO_CONFIRM: '0',
  MANUAL_CONFIRM: '1',
} as const;

export const APPOINTMENT_STATUS_COLORS = {
  requested: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  confirmed: 'bg-green-100 text-green-800 border-green-300',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  'no-show': 'bg-orange-100 text-orange-800 border-orange-300',
} as const;

// ============================================================================
// BOOKING SOURCE
// ============================================================================

export const BOOKING_SOURCE_LABELS = {
  online: 'Online Booking',
  'walk-in': 'Walk-in',
  phone: 'Phone',
  app: 'Mobile App',
} as const;

export const BOOKING_SOURCE_COLORS = {
  online: 'bg-blue-500',
  'walk-in': 'bg-green-500',
  phone: 'bg-purple-500',
  app: 'bg-pink-500',
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

/** Minimum appointment duration in minutes */
export const MIN_APPOINTMENT_DURATION = 15;

/** Maximum appointment duration in minutes */
export const MAX_APPOINTMENT_DURATION = 480; // 8 hours

/** Maximum appointments per time slot */
export const MAX_APPOINTMENTS_PER_SLOT = 10;

/** Maximum days in advance for booking */
export const MAX_BOOKING_DAYS_ADVANCE = 90;

// ============================================================================
// UI CONSTANTS
// ============================================================================

/** Minimum touch target size (accessibility) */
export const MIN_TOUCH_TARGET_SIZE = 44;

/** Animation duration in milliseconds */
export const ANIMATION_DURATION_MS = 200;

/** Toast notification duration in milliseconds */
export const TOAST_DURATION_MS = 3000;

// ============================================================================
// CALENDAR VIEWS
// ============================================================================

export const CALENDAR_VIEWS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  AGENDA: 'agenda',
} as const;

export type CalendarView = typeof CALENDAR_VIEWS[keyof typeof CALENDAR_VIEWS];

// ============================================================================
// TIME WINDOW MODES
// ============================================================================

export const TIME_WINDOW_MODES = {
  TWO_HOUR: '2hour',
  FULL_DAY: 'fullday',
} as const;

export type TimeWindowMode = typeof TIME_WINDOW_MODES[keyof typeof TIME_WINDOW_MODES];

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  NO_TECH_AVAILABLE: 'No technician is available at this time. Please select a different time slot or choose "Next Available".',
  TIME_CONFLICT: 'This time slot is already booked. Please select another time.',
  PAST_BOOKING: 'Cannot book appointments in the past.',
  MISSING_CLIENT_INFO: 'Please provide client name and phone number.',
  MISSING_SERVICES: 'Please select at least one service.',
  INVALID_PHONE: 'Please enter a valid phone number in format: (123) 456-7890',
  BOOKING_FAILED: 'Unable to book appointment. Please try again.',
  NETWORK_ERROR: 'Network error. Your changes will be saved when connection is restored.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  APPOINTMENT_BOOKED: 'Appointment booked successfully!',
  APPOINTMENT_UPDATED: 'Appointment updated successfully!',
  APPOINTMENT_CANCELLED: 'Appointment cancelled successfully!',
  CHANGES_SAVED: 'Changes saved successfully!',
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  NEW_APPOINTMENT: 'n',
  SEARCH: '/',
  TODAY: 't',
  NEXT_DAY: 'ArrowRight',
  PREV_DAY: 'ArrowLeft',
  ESCAPE: 'Escape',
  ENTER: 'Enter',
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  SELECTED_STAFF: 'appointment_selected_staff',
  CALENDAR_VIEW: 'appointment_calendar_view',
  TIME_WINDOW_MODE: 'appointment_time_window_mode',
  LAST_SELECTED_DATE: 'appointment_last_date',
} as const;
