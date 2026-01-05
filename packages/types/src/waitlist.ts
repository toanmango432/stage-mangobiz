/**
 * Waitlist Types
 * PRD Reference: PRD-API-Specifications.md Section 4.13
 *
 * Walk-in queue management for salons that accept walk-ins.
 * Tracks position, estimated wait times, and notifications.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Waitlist entry status */
export type WaitlistStatus =
  | 'waiting'     // In queue, waiting
  | 'notified'    // Notified that it's their turn
  | 'seated'      // Converted to appointment/ticket
  | 'no-show'     // Didn't respond to notification
  | 'cancelled';  // Removed from waitlist

// ============================================
// WAITLIST ENTRY ENTITY
// ============================================

/**
 * A client waiting for service (walk-in queue).
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface WaitlistEntry extends BaseSyncableEntity {
  /** Client ID (optional for new walk-ins without profile) */
  clientId?: string;

  /** Client name */
  clientName: string;

  /** Client phone (for notifications) */
  clientPhone: string;

  /** Client email (optional) */
  clientEmail?: string;

  /** Services requested */
  requestedServices: string[];

  /** Service names (denormalized) */
  requestedServiceNames?: string[];

  /** Preferred staff member (optional) */
  preferredStaffId?: string;

  /** Preferred staff name (denormalized) */
  preferredStaffName?: string;

  /** Number of people in party (for group services) */
  partySize: number;

  /** When added to waitlist */
  addedAt: string;

  /** Estimated wait time in minutes */
  estimatedWaitMinutes: number;

  /** Position in queue */
  position: number;

  /** Current status */
  status: WaitlistStatus;

  /** When client was notified */
  notifiedAt?: string;

  /** How many times notified */
  notificationCount?: number;

  /** When client was seated/converted */
  seatedAt?: string;

  /** Created appointment ID (when converted) */
  appointmentId?: string;

  /** Created ticket ID (when converted) */
  ticketId?: string;

  /** Notes */
  notes?: string;

  /** Priority level (for VIP clients) */
  priority?: 'normal' | 'high' | 'vip';

  /** Quoted wait time at time of check-in */
  quotedWaitMinutes?: number;
}

// ============================================
// WAITLIST SETTINGS
// ============================================

/**
 * Waitlist configuration for a location.
 */
export interface WaitlistSettings {
  /** Whether waitlist is enabled */
  enabled: boolean;

  /** Maximum entries allowed in waitlist */
  maxEntries?: number;

  /** Auto-notify when position is reached */
  autoNotify: boolean;

  /** Minutes to wait after notification before marking no-show */
  noShowTimeoutMinutes: number;

  /** Notification methods */
  notificationMethods: ('sms' | 'push')[];

  /** Show estimated wait time to clients */
  showEstimatedWait: boolean;

  /** Average service duration for wait calculation (minutes) */
  averageServiceDuration: number;

  /** Allow clients to check waitlist status via link */
  allowStatusCheck: boolean;

  /** Custom message for waitlist notification */
  notificationTemplate?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for adding to waitlist.
 */
export interface AddToWaitlistInput {
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  requestedServices: string[];
  preferredStaffId?: string;
  partySize?: number;
  notes?: string;
  priority?: 'normal' | 'high' | 'vip';
}

/**
 * Input for updating waitlist entry.
 */
export interface UpdateWaitlistEntryInput {
  entryId: string;
  requestedServices?: string[];
  preferredStaffId?: string;
  partySize?: number;
  notes?: string;
  priority?: 'normal' | 'high' | 'vip';
}

/**
 * Input for converting waitlist entry to appointment.
 */
export interface ConvertWaitlistInput {
  entryId: string;
  staffId: string;
  startTime: string;
  notes?: string;
}

// ============================================
// WAITLIST ANALYTICS
// ============================================

/**
 * Waitlist metrics for a time period.
 */
export interface WaitlistMetrics {
  /** Total entries added */
  totalEntries: number;

  /** Entries converted to appointments */
  converted: number;

  /** Entries that were no-shows */
  noShows: number;

  /** Entries cancelled */
  cancelled: number;

  /** Conversion rate (converted / total) */
  conversionRate: number;

  /** Average wait time (minutes) */
  averageWaitMinutes: number;

  /** Maximum wait time (minutes) */
  maxWaitMinutes: number;

  /** Average party size */
  averagePartySize: number;

  /** Busiest day of week */
  busiestDay?: string;

  /** Busiest hour */
  busiestHour?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets status display info for a waitlist entry.
 */
export function getWaitlistStatusInfo(status: WaitlistStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'waiting':
      return { label: 'Waiting', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    case 'notified':
      return { label: 'Notified', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    case 'seated':
      return { label: 'Seated', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'no-show':
      return { label: 'No Show', color: 'text-red-700', bgColor: 'bg-red-100' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Calculates estimated wait time based on position and average service duration.
 */
export function calculateEstimatedWait(
  position: number,
  averageServiceDuration: number,
  availableStaff: number
): number {
  if (availableStaff <= 0) return position * averageServiceDuration;
  return Math.ceil((position * averageServiceDuration) / availableStaff);
}

/**
 * Formats wait time for display.
 */
export function formatWaitTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Creates default waitlist settings.
 */
export function createDefaultWaitlistSettings(): WaitlistSettings {
  return {
    enabled: true,
    maxEntries: 50,
    autoNotify: true,
    noShowTimeoutMinutes: 15,
    notificationMethods: ['sms'],
    showEstimatedWait: true,
    averageServiceDuration: 45,
    allowStatusCheck: true,
  };
}

/**
 * Checks if entry can be notified.
 */
export function canNotifyEntry(entry: WaitlistEntry): boolean {
  return entry.status === 'waiting' && entry.position === 1;
}

/**
 * Checks if entry is overdue for no-show.
 */
export function isOverdueNoShow(
  entry: WaitlistEntry,
  timeoutMinutes: number
): boolean {
  if (entry.status !== 'notified' || !entry.notifiedAt) return false;

  const notifiedTime = new Date(entry.notifiedAt);
  const now = new Date();
  const minutesSinceNotified = (now.getTime() - notifiedTime.getTime()) / 60000;

  return minutesSinceNotified > timeoutMinutes;
}
