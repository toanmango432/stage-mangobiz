/**
 * Turn Log Type Adapter
 *
 * Converts between Supabase TurnLogRow and app TurnEntry types.
 */

import type { TurnLogRow, TurnLogInsert, TurnType } from '../types';

/**
 * App-side TurnEntry type for turn tracker.
 * This is the format used by the TurnTracker components.
 */
export interface TurnEntry {
  id: string;
  storeId: string;
  staffId: string;
  date: string;
  timestamp: string;
  turnNumber: number;
  turnValue: number;
  turnType: TurnType;
  amount: number;
  serviceCount: number;
  bonusAmount: number;
  clientName: string;
  services: string[];
  ticketId: string;
  appointmentId: string | null;
  adjustmentReason: string | null;
  adjustedBy: string | null;
  isVoided: boolean;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  createdAt: string;
}

/**
 * Convert Supabase TurnLogRow to app TurnEntry type
 */
export function toTurnEntry(row: TurnLogRow): TurnEntry {
  return {
    id: row.id,
    storeId: row.store_id,
    staffId: row.staff_id,
    date: row.date,
    timestamp: row.turn_timestamp,
    turnNumber: row.turn_number,
    turnValue: row.turn_value,
    turnType: row.turn_type,
    amount: row.service_amount,
    serviceCount: row.services?.length || 0,
    bonusAmount: row.turn_type === 'bonus' ? row.service_amount : 0,
    clientName: row.client_name || '',
    services: row.services || [],
    ticketId: row.ticket_id || '',
    appointmentId: row.appointment_id,
    adjustmentReason: row.adjustment_reason,
    adjustedBy: row.adjusted_by,
    isVoided: row.is_voided,
    voidedAt: row.voided_at,
    voidedBy: row.voided_by,
    voidReason: row.void_reason,
    createdAt: row.created_at,
  };
}

/**
 * Convert app TurnEntry to Supabase TurnLogInsert
 */
export function toTurnLogInsert(
  entry: Omit<TurnEntry, 'id' | 'createdAt' | 'isVoided' | 'voidedAt' | 'voidedBy' | 'voidReason'>,
  storeId?: string
): Omit<TurnLogInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || entry.storeId,
    staff_id: entry.staffId,
    date: entry.date,
    turn_number: entry.turnNumber,
    turn_type: entry.turnType,
    turn_value: entry.turnValue,
    ticket_id: entry.ticketId || null,
    appointment_id: entry.appointmentId || null,
    client_name: entry.clientName || null,
    services: entry.services || null,
    service_amount: entry.amount,
    adjustment_reason: entry.adjustmentReason || null,
    adjusted_by: entry.adjustedBy || null,
    turn_timestamp: entry.timestamp,
  };
}

/**
 * Convert array of TurnLogRows to TurnEntry
 */
export function toTurnEntries(rows: TurnLogRow[]): TurnEntry[] {
  return rows.map(toTurnEntry);
}

/**
 * Simplified TurnEntry for display in UI components.
 * Matches the existing TurnEntry interface used by TurnTracker components.
 */
export function toSimpleTurnEntry(row: TurnLogRow): {
  id: string;
  timestamp: string;
  turnNumber: number;
  amount: number;
  serviceCount: number;
  bonusAmount: number;
  clientName: string;
  services: string[];
  type: 'service' | 'checkout' | 'void';
  ticketId: string;
} {
  // Map turn_type to the simpler type used by UI components
  let simpleType: 'service' | 'checkout' | 'void' = 'service';
  if (row.turn_type === 'checkout') simpleType = 'checkout';
  if (row.turn_type === 'void' || row.is_voided) simpleType = 'void';

  return {
    id: row.id,
    timestamp: row.turn_timestamp,
    turnNumber: row.turn_number,
    amount: row.service_amount,
    serviceCount: row.services?.length || 0,
    bonusAmount: row.turn_type === 'bonus' ? row.service_amount : 0,
    clientName: row.client_name || '',
    services: row.services || [],
    type: simpleType,
    ticketId: row.ticket_id || '',
  };
}

/**
 * Convert array to simple entries for UI
 */
export function toSimpleTurnEntries(rows: TurnLogRow[]): ReturnType<typeof toSimpleTurnEntry>[] {
  return rows.map(toSimpleTurnEntry);
}
