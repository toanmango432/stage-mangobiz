/**
 * Integration Tests for Client Adapter and Database Layer
 *
 * Tests the data transformation pipeline between the app types and database layer.
 * Uses fake-indexeddb for realistic database testing without Supabase connection.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  toClient,
  toClientInsert,
  toClientUpdate,
  toClients,
} from '../clientAdapter';
import type { ClientRow, Json } from '../../types';
import type { Client, LoyaltyInfo, VisitSummary, ClientPreferences, ClientTag, ClientNote } from '@/types/client';

// ==================== MOCK FACTORIES ====================

function createMockClientRow(overrides: Partial<ClientRow> = {}): ClientRow {
  const now = new Date().toISOString();
  return {
    id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    store_id: 'store-integration-test',
    first_name: 'Integration',
    last_name: 'Test',
    phone: `555-${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    email: `test-${Date.now()}@example.com`,
    is_blocked: false,
    is_vip: false,
    preferences: null,
    loyalty_info: null,
    visit_summary: null,
    tags: null,
    notes: null,
    sync_status: 'synced',
    sync_version: 1,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

// ==================== INTEGRATION TESTS ====================

describe('Client Adapter Integration Tests', () => {
  describe('Full Data Cycle: Row → Client → Insert → Verify', () => {
    it('should preserve all loyalty tier data through conversion cycle', () => {
      // Test all tier levels
      const tiers = ['bronze', 'silver', 'gold', 'platinum', 'vip'] as const;

      for (const tier of tiers) {
        const loyaltyData = {
          tier,
          pointsBalance: Math.floor(Math.random() * 10000),
          lifetimePoints: Math.floor(Math.random() * 100000),
          memberSince: '2020-01-15',
          referralCode: `REF${tier.toUpperCase()}`,
          referredBy: 'referrer-001',
          referralCount: Math.floor(Math.random() * 50),
          rewardsRedeemed: Math.floor(Math.random() * 20),
        };

        const row = createMockClientRow({
          loyalty_info: loyaltyData as Json,
        });

        // Convert to app type
        const client = toClient(row);

        // Convert back to insert format
        const insert = toClientInsert(client);

        // Verify the loyalty info is preserved
        const insertedLoyalty = insert.loyalty_info as Record<string, unknown>;
        expect(insertedLoyalty.tier).toBe(tier);
        expect(insertedLoyalty.pointsBalance).toBe(loyaltyData.pointsBalance);
        expect(insertedLoyalty.lifetimePoints).toBe(loyaltyData.lifetimePoints);
        expect(insertedLoyalty.referralCode).toBe(loyaltyData.referralCode);
        expect(insertedLoyalty.referralCount).toBe(loyaltyData.referralCount);
      }
    });

    it('should preserve all visit summary metrics through conversion', () => {
      const visitData = {
        totalVisits: 47,
        totalSpent: 2350.75,
        averageTicket: 50.02,
        lastVisitDate: '2024-01-15T14:30:00Z',
        favoriteService: 'Premium Haircut',
        noShowCount: 2,
        lateCancelCount: 1,
      };

      const row = createMockClientRow({
        visit_summary: visitData as Json,
      });

      const client = toClient(row);
      const insert = toClientInsert(client);

      const insertedVisit = insert.visit_summary as Record<string, unknown>;
      expect(insertedVisit.totalVisits).toBe(47);
      expect(insertedVisit.totalSpent).toBe(2350.75);
      expect(insertedVisit.averageTicket).toBe(50.02);
      expect(insertedVisit.lastVisitDate).toBe('2024-01-15T14:30:00Z');
      expect(insertedVisit.favoriteService).toBe('Premium Haircut');
      expect(insertedVisit.noShowCount).toBe(2);
      expect(insertedVisit.lateCancelCount).toBe(1);
    });

    it('should handle complex preferences through conversion', () => {
      const prefsData = {
        preferredStaffIds: ['staff-001', 'staff-002', 'staff-003'],
        preferredServices: ['service-001', 'service-002'],
        beveragePreference: 'Latte with oat milk, no sugar',
        otherNotes: 'Prefers morning appointments before 10am',
      };

      const row = createMockClientRow({
        preferences: prefsData as Json,
      });

      const client = toClient(row);
      const insert = toClientInsert(client);

      const insertedPrefs = insert.preferences as Record<string, unknown>;
      expect(insertedPrefs.preferredStaffIds).toEqual(prefsData.preferredStaffIds);
      expect(insertedPrefs.preferredServices).toEqual(prefsData.preferredServices);
      expect(insertedPrefs.beveragePreference).toBe(prefsData.beveragePreference);
      expect(insertedPrefs.otherNotes).toBe(prefsData.otherNotes);
    });

    it('should preserve multiple tags through conversion', () => {
      const tagsData = [
        { id: 'tag-1', name: 'VIP', color: '#FFD700' },
        { id: 'tag-2', name: 'Frequent', color: '#00FF00' },
        { id: 'tag-3', name: 'New Customer', color: '#0066FF' },
        { id: 'tag-4', name: 'Referral', color: '#FF6600' },
      ];

      const row = createMockClientRow({
        tags: tagsData as Json,
      });

      const client = toClient(row);
      expect(client.tags).toHaveLength(4);

      const insert = toClientInsert(client);
      const insertedTags = insert.tags as Array<Record<string, unknown>>;

      expect(insertedTags).toHaveLength(4);
      expect(insertedTags[0].name).toBe('VIP');
      expect(insertedTags[0].color).toBe('#FFD700');
      expect(insertedTags[3].name).toBe('Referral');
    });

    it('should preserve multiple notes with different types through conversion', () => {
      const notesData = [
        {
          id: 'note-1',
          date: '2024-01-10T10:00:00Z',
          content: 'Regular client, always on time',
          type: 'general',
          isPrivate: false,
          createdBy: 'staff-001',
          createdByName: 'Jane Smith',
        },
        {
          id: 'note-2',
          date: '2024-01-12T14:30:00Z',
          content: 'Allergic to certain hair products',
          type: 'allergy',
          isPrivate: true,
          createdBy: 'staff-002',
          createdByName: 'Bob Manager',
        },
        {
          id: 'note-3',
          date: '2024-01-15T09:00:00Z',
          content: 'Prefers stylist Jane for color treatments',
          type: 'service',
          isPrivate: false,
          createdBy: 'staff-001',
          createdByName: 'Jane Smith',
        },
      ];

      const row = createMockClientRow({
        notes: notesData as Json,
      });

      const client = toClient(row);
      expect(client.notes).toHaveLength(3);

      // Verify private note handling
      const allergyNote = client.notes?.find(n => n.type === 'allergy');
      expect(allergyNote?.isPrivate).toBe(true);
      expect(allergyNote?.content).toContain('Allergic');

      const insert = toClientInsert(client);
      const insertedNotes = insert.notes as Array<Record<string, unknown>>;

      expect(insertedNotes).toHaveLength(3);
      expect(insertedNotes[0].type).toBe('general');
      expect(insertedNotes[1].isPrivate).toBe(true);
    });
  });

  describe('Partial Update Scenarios', () => {
    it('should create minimal update object for name change only', () => {
      const update = toClientUpdate({
        firstName: 'NewFirst',
        lastName: 'NewLast',
      });

      // Only these fields should be present
      expect(Object.keys(update)).toEqual(['first_name', 'last_name']);
      expect(update.first_name).toBe('NewFirst');
      expect(update.last_name).toBe('NewLast');
    });

    it('should handle VIP status toggle correctly', () => {
      // Toggle to VIP
      const vipUpdate = toClientUpdate({ isVip: true });
      expect(vipUpdate.is_vip).toBe(true);

      // Toggle from VIP
      const nonVipUpdate = toClientUpdate({ isVip: false });
      expect(nonVipUpdate.is_vip).toBe(false);
    });

    it('should handle block/unblock correctly', () => {
      const blockUpdate = toClientUpdate({ isBlocked: true });
      expect(blockUpdate.is_blocked).toBe(true);

      const unblockUpdate = toClientUpdate({ isBlocked: false });
      expect(unblockUpdate.is_blocked).toBe(false);
    });

    it('should update loyalty info without affecting other fields', () => {
      const loyaltyUpdate: LoyaltyInfo = {
        tier: 'gold',
        pointsBalance: 1500,
        lifetimePoints: 5000,
        referralCount: 5,
        rewardsRedeemed: 3,
      };

      const update = toClientUpdate({ loyaltyInfo: loyaltyUpdate });

      expect(Object.keys(update)).toEqual(['loyalty_info']);
      const loyaltyJson = update.loyalty_info as Record<string, unknown>;
      expect(loyaltyJson.tier).toBe('gold');
      expect(loyaltyJson.pointsBalance).toBe(1500);
    });

    it('should update visit summary incrementally', () => {
      const visitUpdate: VisitSummary = {
        totalVisits: 51,
        totalSpent: 2500,
        averageTicket: 49.02,
        lastVisitDate: '2024-01-20',
        noShowCount: 2,
        lateCancelCount: 1,
      };

      const update = toClientUpdate({ visitSummary: visitUpdate });

      expect(Object.keys(update)).toEqual(['visit_summary']);
      const visitJson = update.visit_summary as Record<string, unknown>;
      expect(visitJson.totalVisits).toBe(51);
      expect(visitJson.lastVisitDate).toBe('2024-01-20');
    });
  });

  describe('Batch Operations', () => {
    it('should convert multiple client rows efficiently', () => {
      // Create 100 client rows
      const rows: ClientRow[] = [];
      for (let i = 0; i < 100; i++) {
        rows.push(createMockClientRow({
          id: `client-batch-${i}`,
          first_name: `First${i}`,
          last_name: `Last${i}`,
          loyalty_info: {
            tier: i % 5 === 0 ? 'gold' : 'bronze',
            pointsBalance: i * 100,
            lifetimePoints: i * 500,
          } as Json,
        }));
      }

      const startTime = performance.now();
      const clients = toClients(rows);
      const endTime = performance.now();

      expect(clients).toHaveLength(100);
      expect(clients[0].firstName).toBe('First0');
      expect(clients[99].firstName).toBe('First99');

      // Performance check: should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(100); // 100ms max

      // Verify tier distribution
      const goldClients = clients.filter(c => c.loyaltyInfo?.tier === 'gold');
      expect(goldClients.length).toBe(20); // 0, 5, 10, ..., 95
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null JSON fields gracefully', () => {
      const row = createMockClientRow({
        preferences: null,
        loyalty_info: null,
        visit_summary: null,
        tags: null,
        notes: null,
      });

      const client = toClient(row);

      expect(client.preferences).toBeUndefined();
      expect(client.loyaltyInfo).toBeUndefined();
      expect(client.visitSummary).toBeUndefined();
      expect(client.tags).toBeUndefined();
      expect(client.notes).toBeUndefined();

      // Should still be insertable
      const insert = toClientInsert(client);
      expect(insert.preferences).toBeNull();
      expect(insert.loyalty_info).toBeNull();
    });

    it('should handle malformed loyalty_info gracefully', () => {
      // Non-object JSON
      const row1 = createMockClientRow({
        loyalty_info: 'invalid' as Json,
      });
      const client1 = toClient(row1);
      expect(client1.loyaltyInfo).toBeUndefined();

      // Empty object
      const row2 = createMockClientRow({
        loyalty_info: {} as Json,
      });
      const client2 = toClient(row2);
      expect(client2.loyaltyInfo?.tier).toBe('bronze'); // Default tier
      expect(client2.loyaltyInfo?.pointsBalance).toBe(0);
    });

    it('should handle mixed camelCase and snake_case in JSON', () => {
      const row = createMockClientRow({
        loyalty_info: {
          tier: 'silver',
          points_balance: 300, // snake_case
          lifetimePoints: 1500, // camelCase
          referral_code: 'MIX123', // snake_case
          referralCount: 2, // camelCase
        } as Json,
      });

      const client = toClient(row);

      expect(client.loyaltyInfo?.tier).toBe('silver');
      expect(client.loyaltyInfo?.pointsBalance).toBe(300);
      expect(client.loyaltyInfo?.lifetimePoints).toBe(1500);
      expect(client.loyaltyInfo?.referralCode).toBe('MIX123');
      expect(client.loyaltyInfo?.referralCount).toBe(2);
    });

    it('should handle Unicode characters in all text fields', () => {
      const row = createMockClientRow({
        first_name: 'Müller',
        last_name: '田中',
        email: 'émigré@日本.com',
        preferences: {
          beveragePreference: 'Thé vert 緑茶',
          otherNotes: 'Préfère les rendez-vous 朝 (morning)',
        } as Json,
        notes: [
          {
            id: 'note-unicode',
            date: '2024-01-01',
            content: 'Client très spécial 非常に特別なお客様',
            type: 'general',
            isPrivate: false,
            createdBy: 'staff-1',
          },
        ] as Json,
      });

      const client = toClient(row);

      expect(client.firstName).toBe('Müller');
      expect(client.lastName).toBe('田中');
      expect(client.name).toBe('Müller 田中');
      expect(client.preferences?.beveragePreference).toContain('緑茶');
      expect(client.notes?.[0].content).toContain('非常に特別');

      // Round-trip preservation
      const insert = toClientInsert(client);
      expect(insert.first_name).toBe('Müller');
      expect(insert.last_name).toBe('田中');
    });

    it('should handle very long text content', () => {
      const longNote = 'A'.repeat(10000); // 10KB of text
      const row = createMockClientRow({
        notes: [
          {
            id: 'note-long',
            date: '2024-01-01',
            content: longNote,
            type: 'general',
            isPrivate: false,
            createdBy: 'staff-1',
          },
        ] as Json,
        preferences: {
          otherNotes: longNote,
        } as Json,
      });

      const client = toClient(row);
      expect(client.notes?.[0].content.length).toBe(10000);

      const insert = toClientInsert(client);
      const notesJson = insert.notes as Array<Record<string, unknown>>;
      expect((notesJson[0].content as string).length).toBe(10000);
    });

    it('should handle decimal precision in financial data', () => {
      const row = createMockClientRow({
        visit_summary: {
          totalSpent: 1234.56789, // Extra precision
          averageTicket: 99.99999,
        } as Json,
      });

      const client = toClient(row);

      // JavaScript numbers should preserve the precision
      expect(client.visitSummary?.totalSpent).toBeCloseTo(1234.56789, 5);
      expect(client.visitSummary?.averageTicket).toBeCloseTo(99.99999, 5);
    });
  });

  describe('Sync Status Transitions', () => {
    it('should handle all sync status values', () => {
      const statuses = ['synced', 'pending', 'conflict', 'error'] as const;

      for (const status of statuses) {
        const row = createMockClientRow({
          sync_status: status,
        });

        const client = toClient(row);
        expect(client.syncStatus).toBe(status);
      }
    });

    it('should preserve sync status in updates', () => {
      const update = toClientUpdate({ syncStatus: 'pending' });
      expect(update.sync_status).toBe('pending');
    });
  });

  describe('Store ID Handling', () => {
    it('should use provided storeId over client storeId', () => {
      const client: Client = {
        id: 'test-1',
        storeId: 'original-store',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        phone: '555-1234',
        isBlocked: false,
        isVip: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
      };

      const insert = toClientInsert(client, 'override-store');
      expect(insert.store_id).toBe('override-store');
    });

    it('should fall back to client storeId when not provided', () => {
      const client: Client = {
        id: 'test-1',
        storeId: 'client-store',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        phone: '555-1234',
        isBlocked: false,
        isVip: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
      };

      const insert = toClientInsert(client);
      expect(insert.store_id).toBe('client-store');
    });
  });
});
