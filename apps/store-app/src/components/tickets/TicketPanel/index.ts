/**
 * TicketPanel Module
 *
 * A modular ticket management panel for the checkout flow.
 * This module provides components for staff selection, service management,
 * summary display, and action handling.
 *
 * Usage:
 * import { StaffSection, ServiceSection, SummarySection, ActionBar } from '@/components/tickets/TicketPanel';
 *
 * Or import types:
 * import type { TicketPanelProps, TicketService, StaffMember } from '@/components/tickets/TicketPanel/types';
 */

// Export sub-components
export { default as StaffSection } from './components/StaffSection';
export { default as ServiceSection } from './components/ServiceSection';
export { default as SummarySection } from './components/SummarySection';
export { default as ActionBar } from './components/ActionBar';

// Export types
export type {
  PanelMode,
  StaffMember,
  TicketService,
  TicketProduct,
  TicketClient,
  TicketDiscount,
  TicketPayment,
  TicketState,
  TicketPanelProps,
  StaffSectionProps,
  ServiceSectionProps,
  SummarySectionProps,
  ActionBarProps,
} from './types';

// Export constants
export {
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
  MOCK_OPEN_TICKETS,
} from './constants';

// Note: The main TicketPanel component remains at src/components/checkout/TicketPanel.tsx
// This module provides extracted sub-components that can be used independently
// or composed together for custom ticket panel implementations.
