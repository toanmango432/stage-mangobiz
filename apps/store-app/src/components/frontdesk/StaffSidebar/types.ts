/**
 * StaffSidebar Types
 *
 * Centralized type definitions for the StaffSidebar module.
 * Re-exports commonly used types from other slices for convenience.
 */

import type { FrontDeskSettingsData } from '@/components/frontdesk-settings/types';
import type { UIStaff } from '@/store/slices/uiStaffSlice';
import type { UITicket } from '@/store/slices/uiTicketsSlice';
import type { LocalAppointment } from '@/types/appointment';
import type { TeamSettings } from '@/components/TeamSettingsPanel';

// Re-export commonly used types
export type { UIStaff, UITicket, LocalAppointment, TeamSettings, FrontDeskSettingsData };

/**
 * Props for the main StaffSidebar component
 */
export interface StaffSidebarProps {
  settings?: FrontDeskSettingsData;
}

/**
 * Staff counts by status for display in filter pills
 */
export interface StaffCounts {
  clockedIn: number;
  clockedOut: number;
  ready: number;
  busy: number;
  total: number;
}

/**
 * Active ticket info to display on staff cards
 */
export interface ActiveTicket {
  id: number;
  ticketNumber?: string | number;
  clientName: string;
  serviceName: string;
  status: 'in-service' | 'pending';
}

/**
 * Current ticket info for staff progress display
 */
export interface CurrentTicketInfo {
  timeLeft: number;
  totalTime: number;
  progress: number;
  startTime: string;
  serviceName?: string;
  clientName?: string;
}

/**
 * Return type for getStaffTicketInfo helper
 */
export interface StaffTicketInfoResult {
  activeTickets: ActiveTicket[];
  currentTicketInfo: CurrentTicketInfo | null;
}

/**
 * View mode for staff card display density
 */
export type ViewMode = 'normal' | 'compact';

/**
 * Width type for sidebar sizing
 */
export type WidthType = 'fixed' | 'percentage';

/**
 * Staff member extended with ticket info for display
 * Uses Omit to override activeTickets and currentTicketInfo with our specific types
 */
export type StaffMemberWithInfo = Omit<UIStaff, 'activeTickets' | 'currentTicketInfo'> & {
  activeTickets?: ActiveTicket[];
  currentTicketInfo?: CurrentTicketInfo;
};

/**
 * US-020: Custom event type declarations for StaffSidebar
 *
 * Extend WindowEventMap to add type-safe custom events used in the module.
 * This allows TypeScript to properly type event listeners and dispatchers.
 */
export interface StaffSidebarCustomEvents {
  'open-turn-tracker': Event;
}

// Extend global WindowEventMap
declare global {
  type WindowEventMap = StaffSidebarCustomEvents
}

/**
 * Type-safe event dispatcher for StaffSidebar custom events
 */
export function dispatchStaffSidebarEvent<K extends keyof StaffSidebarCustomEvents>(
  eventName: K,
  event?: StaffSidebarCustomEvents[K]
): void {
  window.dispatchEvent(event || new Event(eventName));
}
