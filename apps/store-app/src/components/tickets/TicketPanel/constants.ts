/**
 * TicketPanel Module Constants
 *
 * Shared constants for all TicketPanel components.
 */

// Tax rates
export const DEFAULT_TAX_RATE = 0.09;
export const TAX_RATES = {
  standard: 0.09,
  reduced: 0.05,
  exempt: 0,
} as const;

// Panel sizes
export const PANEL_WIDTHS = {
  collapsed: 80,
  normal: 400,
  expanded: 600,
} as const;

// Service status options
export const SERVICE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'gray' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'paused', label: 'Paused', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
] as const;

// Service status colors (Tailwind classes)
export const SERVICE_STATUS_COLORS: Record<import('@/store/slices/uiTicketsSlice').ServiceStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

// Discount presets
export const DISCOUNT_PRESETS = [
  { label: '10%', type: 'percentage' as const, value: 10 },
  { label: '15%', type: 'percentage' as const, value: 15 },
  { label: '20%', type: 'percentage' as const, value: 20 },
  { label: '$5', type: 'fixed' as const, value: 5 },
  { label: '$10', type: 'fixed' as const, value: 10 },
  { label: '$25', type: 'fixed' as const, value: 25 },
] as const;

// Tip presets (percentages)
export const TIP_PRESETS = [15, 18, 20, 25] as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  newTicket: { key: 'n', modifiers: ['ctrl', 'shift'], description: 'New Ticket' },
  checkout: { key: 'p', modifiers: ['ctrl'], description: 'Pay / Checkout' },
  addService: { key: 's', modifiers: ['ctrl'], description: 'Add Service' },
  addProduct: { key: 'd', modifiers: ['ctrl'], description: 'Add Product' },
  saveDraft: { key: 's', modifiers: ['ctrl', 'shift'], description: 'Save Draft' },
  clearTicket: { key: 'Escape', modifiers: [], description: 'Clear / Close' },
} as const;

// LocalStorage keys
export const KEYBOARD_HINTS_DISMISSED_KEY = 'ticketPanel_keyboardHintsDismissed';
export const LAST_STAFF_KEY = 'ticketPanel_lastSelectedStaff';
export const PANEL_MODE_KEY = 'ticketPanel_mode';

// Auto-save interval (ms)
export const AUTO_SAVE_INTERVAL = 30000;
export const AUTO_SAVE_DEBOUNCE = 2000;

// Draft expiry (24 hours in ms)
export const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Maximum items per ticket
export const MAX_SERVICES_PER_TICKET = 50;
export const MAX_PRODUCTS_PER_TICKET = 100;

// Animation durations (ms)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Mock data for development (used in existing TicketPanel)
export const MOCK_OPEN_TICKETS = [
  {
    id: 'ticket-1',
    clientName: 'Jane Doe',
    total: 125.0,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'ticket-2',
    clientName: 'John Smith',
    total: 85.5,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
] as const;

export default {
  DEFAULT_TAX_RATE,
  TAX_RATES,
  PANEL_WIDTHS,
  SERVICE_STATUS_OPTIONS,
  SERVICE_STATUS_COLORS,
  DISCOUNT_PRESETS,
  TIP_PRESETS,
  KEYBOARD_SHORTCUTS,
  KEYBOARD_HINTS_DISMISSED_KEY,
  AUTO_SAVE_INTERVAL,
  AUTO_SAVE_DEBOUNCE,
};
