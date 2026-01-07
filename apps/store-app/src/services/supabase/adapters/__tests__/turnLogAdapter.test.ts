/**
 * Unit Tests for Turn Log Adapter
 *
 * Tests the conversion between Supabase TurnLogRow and app TurnEntry types.
 */

import { describe, it, expect } from 'vitest';
import {
  toTurnEntry,
  toTurnEntries,
  toTurnLogInsert,
  toSimpleTurnEntry,
  toSimpleTurnEntries,
} from '../turnLogAdapter';
import type { TurnLogRow } from '../../types';

// Mock TurnLogRow factory
function createMockTurnLogRow(overrides: Partial<TurnLogRow> = {}): TurnLogRow {
  const now = new Date().toISOString();
  return {
    id: 'turn-001',
    store_id: 'store-001',
    staff_id: 'staff-001',
    date: '2026-01-06',
    turn_timestamp: now,
    turn_number: 1,
    turn_type: 'walk_in',
    turn_value: 1,
    ticket_id: 'ticket-001',
    appointment_id: null,
    client_name: 'John Doe',
    services: ['Haircut', 'Shampoo'],
    service_amount: 75.00,
    adjustment_reason: null,
    adjusted_by: null,
    is_voided: false,
    voided_at: null,
    voided_by: null,
    void_reason: null,
    created_at: now,
    ...overrides,
  };
}

describe('turnLogAdapter', () => {
  describe('toTurnEntry', () => {
    it('should convert basic TurnLogRow to TurnEntry', () => {
      const row = createMockTurnLogRow();
      const entry = toTurnEntry(row);

      expect(entry.id).toBe('turn-001');
      expect(entry.storeId).toBe('store-001');
      expect(entry.staffId).toBe('staff-001');
      expect(entry.date).toBe('2026-01-06');
      expect(entry.turnNumber).toBe(1);
      expect(entry.turnType).toBe('walk_in');
    });

    it('should convert turn values correctly', () => {
      const row = createMockTurnLogRow();
      const entry = toTurnEntry(row);

      expect(entry.turnValue).toBe(1);
      expect(entry.amount).toBe(75.00);
      expect(entry.serviceCount).toBe(2);
    });

    it('should parse client and services info', () => {
      const row = createMockTurnLogRow();
      const entry = toTurnEntry(row);

      expect(entry.clientName).toBe('John Doe');
      expect(entry.services).toEqual(['Haircut', 'Shampoo']);
      expect(entry.ticketId).toBe('ticket-001');
    });

    it('should handle appointment-based turns', () => {
      const row = createMockTurnLogRow({
        turn_type: 'appointment',
        appointment_id: 'appt-001',
      });
      const entry = toTurnEntry(row);

      expect(entry.turnType).toBe('appointment');
      expect(entry.appointmentId).toBe('appt-001');
    });

    it('should handle checkout turns', () => {
      const row = createMockTurnLogRow({
        turn_type: 'checkout',
        turn_value: 0.5,
      });
      const entry = toTurnEntry(row);

      expect(entry.turnType).toBe('checkout');
      expect(entry.turnValue).toBe(0.5);
    });

    it('should handle bonus turns', () => {
      const row = createMockTurnLogRow({
        turn_type: 'bonus',
        service_amount: 50.00,
      });
      const entry = toTurnEntry(row);

      expect(entry.turnType).toBe('bonus');
      expect(entry.bonusAmount).toBe(50.00);
    });

    it('should handle voided turns', () => {
      const now = new Date().toISOString();
      const row = createMockTurnLogRow({
        is_voided: true,
        voided_at: now,
        voided_by: 'manager-001',
        void_reason: 'Client cancelled',
      });
      const entry = toTurnEntry(row);

      expect(entry.isVoided).toBe(true);
      expect(entry.voidedAt).toBe(now);
      expect(entry.voidedBy).toBe('manager-001');
      expect(entry.voidReason).toBe('Client cancelled');
    });

    it('should handle adjustment turns', () => {
      const row = createMockTurnLogRow({
        turn_type: 'adjustment',
        adjustment_reason: 'Queue position correction',
        adjusted_by: 'manager-001',
      });
      const entry = toTurnEntry(row);

      expect(entry.turnType).toBe('adjustment');
      expect(entry.adjustmentReason).toBe('Queue position correction');
      expect(entry.adjustedBy).toBe('manager-001');
    });

    it('should handle null optional fields gracefully', () => {
      const row = createMockTurnLogRow({
        client_name: null,
        services: null,
        ticket_id: null,
        appointment_id: null,
      });
      const entry = toTurnEntry(row);

      expect(entry.clientName).toBe('');
      expect(entry.services).toEqual([]);
      expect(entry.ticketId).toBe('');
      expect(entry.appointmentId).toBeNull();
    });
  });

  describe('toTurnEntries', () => {
    it('should convert array of TurnLogRows', () => {
      const rows = [
        createMockTurnLogRow({ id: 'turn-001', turn_number: 1 }),
        createMockTurnLogRow({ id: 'turn-002', turn_number: 2 }),
      ];
      const entries = toTurnEntries(rows);

      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('turn-001');
      expect(entries[0].turnNumber).toBe(1);
      expect(entries[1].id).toBe('turn-002');
      expect(entries[1].turnNumber).toBe(2);
    });

    it('should return empty array for empty input', () => {
      const entries = toTurnEntries([]);
      expect(entries).toEqual([]);
    });
  });

  describe('toTurnLogInsert', () => {
    it('should convert TurnEntry to insert format', () => {
      const entry = {
        storeId: 'store-001',
        staffId: 'staff-001',
        date: '2026-01-06',
        timestamp: new Date().toISOString(),
        turnNumber: 3,
        turnValue: 1,
        turnType: 'walk_in' as const,
        amount: 85.00,
        serviceCount: 2,
        bonusAmount: 0,
        clientName: 'Jane Doe',
        services: ['Color', 'Cut'],
        ticketId: 'ticket-002',
        appointmentId: null,
        adjustmentReason: null,
        adjustedBy: null,
      };
      const insert = toTurnLogInsert(entry, 'store-001');

      expect(insert.store_id).toBe('store-001');
      expect(insert.staff_id).toBe('staff-001');
      expect(insert.date).toBe('2026-01-06');
      expect(insert.turn_number).toBe(3);
      expect(insert.turn_type).toBe('walk_in');
      expect(insert.service_amount).toBe(85.00);
    });

    it('should handle null optional fields correctly', () => {
      const entry = {
        storeId: 'store-001',
        staffId: 'staff-001',
        date: '2026-01-06',
        timestamp: new Date().toISOString(),
        turnNumber: 1,
        turnValue: 1,
        turnType: 'walk_in' as const,
        amount: 50.00,
        serviceCount: 1,
        bonusAmount: 0,
        clientName: '',
        services: [],
        ticketId: '',
        appointmentId: null,
        adjustmentReason: null,
        adjustedBy: null,
      };
      const insert = toTurnLogInsert(entry);

      expect(insert.client_name).toBeNull();
      expect(insert.ticket_id).toBeNull();
      expect(insert.appointment_id).toBeNull();
      expect(insert.adjustment_reason).toBeNull();
    });
  });

  describe('toSimpleTurnEntry', () => {
    it('should convert to simple format for UI', () => {
      const row = createMockTurnLogRow();
      const simple = toSimpleTurnEntry(row);

      expect(simple.id).toBe('turn-001');
      expect(simple.turnNumber).toBe(1);
      expect(simple.amount).toBe(75.00);
      expect(simple.serviceCount).toBe(2);
      expect(simple.clientName).toBe('John Doe');
      expect(simple.type).toBe('service');
    });

    it('should map checkout type correctly', () => {
      const row = createMockTurnLogRow({ turn_type: 'checkout' });
      const simple = toSimpleTurnEntry(row);

      expect(simple.type).toBe('checkout');
    });

    it('should map void type correctly', () => {
      const row = createMockTurnLogRow({ turn_type: 'void' });
      const simple = toSimpleTurnEntry(row);

      expect(simple.type).toBe('void');
    });

    it('should map voided entries to void type', () => {
      const row = createMockTurnLogRow({ is_voided: true });
      const simple = toSimpleTurnEntry(row);

      expect(simple.type).toBe('void');
    });

    it('should handle bonus amount correctly', () => {
      const row = createMockTurnLogRow({
        turn_type: 'bonus',
        service_amount: 25.00,
      });
      const simple = toSimpleTurnEntry(row);

      expect(simple.bonusAmount).toBe(25.00);
    });
  });

  describe('toSimpleTurnEntries', () => {
    it('should convert array to simple format', () => {
      const rows = [
        createMockTurnLogRow({ id: 'turn-001' }),
        createMockTurnLogRow({ id: 'turn-002' }),
      ];
      const simpleEntries = toSimpleTurnEntries(rows);

      expect(simpleEntries).toHaveLength(2);
      expect(simpleEntries[0].id).toBe('turn-001');
      expect(simpleEntries[1].id).toBe('turn-002');
    });
  });
});
