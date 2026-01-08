/**
 * Unit Tests for Client Adapter
 *
 * Tests the conversion between Supabase ClientRow and app Client types.
 * Critical for ensuring data integrity across the storage layer.
 */

import { describe, it, expect } from 'vitest';
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
    id: 'client-001',
    store_id: 'store-001',
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-123-4567',
    email: 'john.doe@example.com',
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

function createMockClient(overrides: Partial<Client> = {}): Client {
  const now = new Date().toISOString();
  return {
    id: 'client-001',
    storeId: 'store-001',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    phone: '555-123-4567',
    email: 'john.doe@example.com',
    isBlocked: false,
    isVip: false,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
    ...overrides,
  };
}

// ==================== toClient TESTS ====================

describe('clientAdapter', () => {
  describe('toClient', () => {
    it('should convert basic ClientRow to Client', () => {
      const row = createMockClientRow();
      const client = toClient(row);

      expect(client.id).toBe('client-001');
      expect(client.storeId).toBe('store-001');
      expect(client.firstName).toBe('John');
      expect(client.lastName).toBe('Doe');
      expect(client.name).toBe('John Doe');
      expect(client.phone).toBe('555-123-4567');
      expect(client.email).toBe('john.doe@example.com');
      expect(client.isBlocked).toBe(false);
      expect(client.isVip).toBe(false);
      expect(client.syncStatus).toBe('synced');
    });

    it('should handle null email correctly', () => {
      const row = createMockClientRow({ email: null });
      const client = toClient(row);

      expect(client.email).toBeUndefined();
    });

    it('should trim whitespace from combined name', () => {
      const row = createMockClientRow({
        first_name: ' Jane ',
        last_name: ' Smith ',
      });
      const client = toClient(row);

      // trim() only removes leading/trailing whitespace from the combined string
      // " Jane " + " " + " Smith " = " Jane   Smith " -> trim() -> "Jane   Smith"
      expect(client.name).toBe('Jane   Smith');
      // Individual names preserve their whitespace
      expect(client.firstName).toBe(' Jane ');
      expect(client.lastName).toBe(' Smith ');
    });

    it('should handle blocked and VIP clients', () => {
      const blockedRow = createMockClientRow({ is_blocked: true });
      const blockedClient = toClient(blockedRow);
      expect(blockedClient.isBlocked).toBe(true);

      const vipRow = createMockClientRow({ is_vip: true });
      const vipClient = toClient(vipRow);
      expect(vipClient.isVip).toBe(true);
    });

    it('should parse loyalty_info JSON with camelCase keys', () => {
      const row = createMockClientRow({
        loyalty_info: {
          tier: 'gold',
          pointsBalance: 500,
          lifetimePoints: 2500,
          memberSince: '2023-01-01',
          referralCode: 'JOHN2023',
          referredBy: 'client-999',
          referralCount: 3,
          rewardsRedeemed: 5,
        } as Json,
      });
      const client = toClient(row);

      expect(client.loyaltyInfo).toBeDefined();
      expect(client.loyaltyInfo?.tier).toBe('gold');
      expect(client.loyaltyInfo?.pointsBalance).toBe(500);
      expect(client.loyaltyInfo?.lifetimePoints).toBe(2500);
      expect(client.loyaltyInfo?.memberSince).toBe('2023-01-01');
      expect(client.loyaltyInfo?.referralCode).toBe('JOHN2023');
      expect(client.loyaltyInfo?.referredBy).toBe('client-999');
      expect(client.loyaltyInfo?.referralCount).toBe(3);
      expect(client.loyaltyInfo?.rewardsRedeemed).toBe(5);
    });

    it('should parse loyalty_info JSON with snake_case keys (backward compatibility)', () => {
      const row = createMockClientRow({
        loyalty_info: {
          tier: 'silver',
          points_balance: 250,
          lifetime_points: 1200,
          member_since: '2022-06-15',
          referral_code: 'JANE2022',
          referred_by: 'client-888',
          referral_count: 1,
          rewards_redeemed: 2,
        } as Json,
      });
      const client = toClient(row);

      expect(client.loyaltyInfo?.tier).toBe('silver');
      expect(client.loyaltyInfo?.pointsBalance).toBe(250);
      expect(client.loyaltyInfo?.lifetimePoints).toBe(1200);
      expect(client.loyaltyInfo?.memberSince).toBe('2022-06-15');
      expect(client.loyaltyInfo?.referralCode).toBe('JANE2022');
      expect(client.loyaltyInfo?.referredBy).toBe('client-888');
      expect(client.loyaltyInfo?.referralCount).toBe(1);
      expect(client.loyaltyInfo?.rewardsRedeemed).toBe(2);
    });

    it('should default loyalty tier to bronze when missing', () => {
      const row = createMockClientRow({
        loyalty_info: {
          pointsBalance: 100,
        } as Json,
      });
      const client = toClient(row);

      expect(client.loyaltyInfo?.tier).toBe('bronze');
    });

    it('should handle null loyalty_info', () => {
      const row = createMockClientRow({ loyalty_info: null });
      const client = toClient(row);

      expect(client.loyaltyInfo).toBeUndefined();
    });

    it('should parse visit_summary JSON with camelCase keys', () => {
      const row = createMockClientRow({
        visit_summary: {
          totalVisits: 25,
          totalSpent: 1500.50,
          averageTicket: 60.02,
          lastVisitDate: '2024-01-15',
          favoriteService: 'Haircut',
          noShowCount: 2,
          lateCancelCount: 1,
        } as Json,
      });
      const client = toClient(row);

      expect(client.visitSummary).toBeDefined();
      expect(client.visitSummary?.totalVisits).toBe(25);
      expect(client.visitSummary?.totalSpent).toBe(1500.50);
      expect(client.visitSummary?.averageTicket).toBe(60.02);
      expect(client.visitSummary?.lastVisitDate).toBe('2024-01-15');
      expect(client.visitSummary?.favoriteService).toBe('Haircut');
      expect(client.visitSummary?.noShowCount).toBe(2);
      expect(client.visitSummary?.lateCancelCount).toBe(1);
    });

    it('should parse visit_summary JSON with snake_case keys (backward compatibility)', () => {
      const row = createMockClientRow({
        visit_summary: {
          total_visits: 10,
          total_spent: 500.00,
          average_ticket: 50.00,
          last_visit_date: '2023-12-01',
          favorite_service: 'Color',
          no_show_count: 0,
          late_cancel_count: 0,
        } as Json,
      });
      const client = toClient(row);

      expect(client.visitSummary?.totalVisits).toBe(10);
      expect(client.visitSummary?.totalSpent).toBe(500.00);
      expect(client.visitSummary?.averageTicket).toBe(50.00);
      expect(client.visitSummary?.lastVisitDate).toBe('2023-12-01');
      expect(client.visitSummary?.favoriteService).toBe('Color');
      expect(client.visitSummary?.noShowCount).toBe(0);
      expect(client.visitSummary?.lateCancelCount).toBe(0);
    });

    it('should default visit_summary numbers to 0 when missing', () => {
      const row = createMockClientRow({
        visit_summary: {} as Json,
      });
      const client = toClient(row);

      expect(client.visitSummary?.totalVisits).toBe(0);
      expect(client.visitSummary?.totalSpent).toBe(0);
      expect(client.visitSummary?.averageTicket).toBe(0);
      expect(client.visitSummary?.noShowCount).toBe(0);
      expect(client.visitSummary?.lateCancelCount).toBe(0);
    });

    it('should parse preferences JSON', () => {
      const row = createMockClientRow({
        preferences: {
          preferredStaffIds: ['staff-001', 'staff-002'],
          preferredServices: ['service-001'],
          beveragePreference: 'Coffee, no sugar',
          otherNotes: 'Prefers morning appointments',
        } as Json,
      });
      const client = toClient(row);

      expect(client.preferences).toBeDefined();
      expect(client.preferences?.preferredStaffIds).toEqual(['staff-001', 'staff-002']);
      expect(client.preferences?.preferredServices).toEqual(['service-001']);
      expect(client.preferences?.beveragePreference).toBe('Coffee, no sugar');
      expect(client.preferences?.otherNotes).toBe('Prefers morning appointments');
    });

    it('should parse preferences JSON with snake_case keys', () => {
      const row = createMockClientRow({
        preferences: {
          preferred_staff_ids: ['staff-003'],
          preferred_services: ['service-002'],
          beverage_preference: 'Tea',
          other_notes: 'No notes',
        } as Json,
      });
      const client = toClient(row);

      expect(client.preferences?.preferredStaffIds).toEqual(['staff-003']);
      expect(client.preferences?.preferredServices).toEqual(['service-002']);
      expect(client.preferences?.beveragePreference).toBe('Tea');
      expect(client.preferences?.otherNotes).toBe('No notes');
    });

    it('should parse tags array', () => {
      const row = createMockClientRow({
        tags: [
          { id: 'tag-001', name: 'VIP', color: '#FFD700' },
          { id: 'tag-002', name: 'New Client', color: '#00FF00' },
        ] as Json,
      });
      const client = toClient(row);

      expect(client.tags).toHaveLength(2);
      expect(client.tags?.[0].id).toBe('tag-001');
      expect(client.tags?.[0].name).toBe('VIP');
      expect(client.tags?.[0].color).toBe('#FFD700');
      expect(client.tags?.[1].name).toBe('New Client');
    });

    it('should handle empty tags array', () => {
      const row = createMockClientRow({ tags: [] as Json });
      const client = toClient(row);

      expect(client.tags).toEqual([]);
    });

    it('should default tag color when missing', () => {
      const row = createMockClientRow({
        tags: [{ id: 'tag-001', name: 'Test' }] as Json,
      });
      const client = toClient(row);

      expect(client.tags?.[0].color).toBe('#888888');
    });

    it('should parse notes array with camelCase keys', () => {
      const row = createMockClientRow({
        notes: [
          {
            id: 'note-001',
            date: '2024-01-15',
            content: 'Client prefers quiet music',
            type: 'general',
            isPrivate: false,
            createdBy: 'staff-001',
            createdByName: 'Jane Smith',
          },
        ] as Json,
      });
      const client = toClient(row);

      expect(client.notes).toHaveLength(1);
      expect(client.notes?.[0].id).toBe('note-001');
      expect(client.notes?.[0].date).toBe('2024-01-15');
      expect(client.notes?.[0].content).toBe('Client prefers quiet music');
      expect(client.notes?.[0].type).toBe('general');
      expect(client.notes?.[0].isPrivate).toBe(false);
      expect(client.notes?.[0].createdBy).toBe('staff-001');
      expect(client.notes?.[0].createdByName).toBe('Jane Smith');
    });

    it('should parse notes array with snake_case keys (backward compatibility)', () => {
      const row = createMockClientRow({
        notes: [
          {
            id: 'note-002',
            date: '2024-01-10',
            content: 'Allergic to certain products',
            type: 'allergy',
            is_private: true,
            created_by: 'staff-002',
            created_by_name: 'John Manager',
          },
        ] as Json,
      });
      const client = toClient(row);

      expect(client.notes?.[0].isPrivate).toBe(true);
      expect(client.notes?.[0].createdBy).toBe('staff-002');
      expect(client.notes?.[0].createdByName).toBe('John Manager');
    });

    it('should default note type to general when missing', () => {
      const row = createMockClientRow({
        notes: [{ id: 'note-001', date: '2024-01-01', content: 'Test' }] as Json,
      });
      const client = toClient(row);

      expect(client.notes?.[0].type).toBe('general');
    });

    it('should preserve timestamps and sync metadata', () => {
      const createdAt = '2023-01-15T10:30:00.000Z';
      const updatedAt = '2024-01-20T15:45:00.000Z';
      const row = createMockClientRow({
        created_at: createdAt,
        updated_at: updatedAt,
        sync_status: 'pending',
      });
      const client = toClient(row);

      expect(client.createdAt).toBe(createdAt);
      expect(client.updatedAt).toBe(updatedAt);
      expect(client.syncStatus).toBe('pending');
    });
  });

  // ==================== toClientInsert TESTS ====================

  describe('toClientInsert', () => {
    it('should convert basic Client to ClientInsert', () => {
      const client = createMockClient();
      const insert = toClientInsert(client);

      expect(insert.store_id).toBe('store-001');
      expect(insert.first_name).toBe('John');
      expect(insert.last_name).toBe('Doe');
      expect(insert.phone).toBe('555-123-4567');
      expect(insert.email).toBe('john.doe@example.com');
      expect(insert.is_blocked).toBe(false);
      expect(insert.is_vip).toBe(false);
      expect(insert.sync_status).toBe('synced');
      expect(insert.sync_version).toBe(1);
    });

    it('should use provided storeId over client.storeId', () => {
      const client = createMockClient({ storeId: 'store-001' });
      const insert = toClientInsert(client, 'store-override');

      expect(insert.store_id).toBe('store-override');
    });

    it('should convert null email to null', () => {
      const client = createMockClient({ email: undefined });
      const insert = toClientInsert(client);

      expect(insert.email).toBeNull();
    });

    it('should serialize loyaltyInfo to JSON', () => {
      const loyaltyInfo: LoyaltyInfo = {
        tier: 'platinum',
        pointsBalance: 1000,
        lifetimePoints: 5000,
        memberSince: '2020-01-01',
        referralCode: 'PLAT2020',
        referredBy: undefined,
        referralCount: 10,
        rewardsRedeemed: 15,
      };
      const client = createMockClient({ loyaltyInfo });
      const insert = toClientInsert(client);

      const loyaltyJson = insert.loyalty_info as Record<string, unknown>;
      expect(loyaltyJson.tier).toBe('platinum');
      expect(loyaltyJson.pointsBalance).toBe(1000);
      expect(loyaltyJson.lifetimePoints).toBe(5000);
      expect(loyaltyJson.memberSince).toBe('2020-01-01');
      expect(loyaltyJson.referralCode).toBe('PLAT2020');
      expect(loyaltyJson.referralCount).toBe(10);
      expect(loyaltyJson.rewardsRedeemed).toBe(15);
    });

    it('should serialize undefined loyaltyInfo to null', () => {
      const client = createMockClient({ loyaltyInfo: undefined });
      const insert = toClientInsert(client);

      expect(insert.loyalty_info).toBeNull();
    });

    it('should serialize visitSummary to JSON', () => {
      const visitSummary: VisitSummary = {
        totalVisits: 50,
        totalSpent: 3000,
        averageTicket: 60,
        lastVisitDate: '2024-01-20',
        favoriteService: 'Premium Cut',
        noShowCount: 1,
        lateCancelCount: 2,
      };
      const client = createMockClient({ visitSummary });
      const insert = toClientInsert(client);

      const visitJson = insert.visit_summary as Record<string, unknown>;
      expect(visitJson.totalVisits).toBe(50);
      expect(visitJson.totalSpent).toBe(3000);
      expect(visitJson.averageTicket).toBe(60);
      expect(visitJson.lastVisitDate).toBe('2024-01-20');
      expect(visitJson.favoriteService).toBe('Premium Cut');
      expect(visitJson.noShowCount).toBe(1);
      expect(visitJson.lateCancelCount).toBe(2);
    });

    it('should serialize preferences to JSON', () => {
      const preferences: ClientPreferences = {
        preferredStaffIds: ['staff-001', 'staff-002'],
        preferredServices: ['service-001', 'service-002'],
        beveragePreference: 'Espresso',
        otherNotes: 'Allergic to certain products',
      };
      const client = createMockClient({ preferences });
      const insert = toClientInsert(client);

      const prefsJson = insert.preferences as Record<string, unknown>;
      expect(prefsJson.preferredStaffIds).toEqual(['staff-001', 'staff-002']);
      expect(prefsJson.preferredServices).toEqual(['service-001', 'service-002']);
      expect(prefsJson.beveragePreference).toBe('Espresso');
      expect(prefsJson.otherNotes).toBe('Allergic to certain products');
    });

    it('should serialize tags array', () => {
      const tags: ClientTag[] = [
        { id: 'tag-001', name: 'VIP', color: '#FFD700' },
        { id: 'tag-002', name: 'Frequent', color: '#00FF00' },
      ];
      const client = createMockClient({ tags });
      const insert = toClientInsert(client);

      const tagsJson = insert.tags as Array<Record<string, unknown>>;
      expect(tagsJson).toHaveLength(2);
      expect(tagsJson[0].id).toBe('tag-001');
      expect(tagsJson[0].name).toBe('VIP');
      expect(tagsJson[0].color).toBe('#FFD700');
    });

    it('should serialize notes array', () => {
      const notes: ClientNote[] = [
        {
          id: 'note-001',
          date: '2024-01-15',
          content: 'Important client note',
          type: 'general',
          isPrivate: false,
          createdBy: 'staff-001',
          createdByName: 'Jane Smith',
        },
      ];
      const client = createMockClient({ notes });
      const insert = toClientInsert(client);

      const notesJson = insert.notes as Array<Record<string, unknown>>;
      expect(notesJson).toHaveLength(1);
      expect(notesJson[0].id).toBe('note-001');
      expect(notesJson[0].content).toBe('Important client note');
      expect(notesJson[0].type).toBe('general');
      expect(notesJson[0].isPrivate).toBe(false);
      expect(notesJson[0].createdBy).toBe('staff-001');
    });

    it('should use default syncStatus when not provided', () => {
      const client = createMockClient({ syncStatus: undefined });
      const insert = toClientInsert(client);

      expect(insert.sync_status).toBe('synced');
    });
  });

  // ==================== toClientUpdate TESTS ====================

  describe('toClientUpdate', () => {
    it('should only include provided fields', () => {
      const updates: Partial<Client> = { firstName: 'Jane' };
      const result = toClientUpdate(updates);

      expect(result.first_name).toBe('Jane');
      expect(result.last_name).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    it('should convert all basic fields', () => {
      const updates: Partial<Client> = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555-999-8888',
        email: 'jane.smith@example.com',
        isBlocked: true,
        isVip: true,
      };
      const result = toClientUpdate(updates);

      expect(result.first_name).toBe('Jane');
      expect(result.last_name).toBe('Smith');
      expect(result.phone).toBe('555-999-8888');
      expect(result.email).toBe('jane.smith@example.com');
      expect(result.is_blocked).toBe(true);
      expect(result.is_vip).toBe(true);
    });

    it('should convert empty email to null', () => {
      const updates: Partial<Client> = { email: '' };
      const result = toClientUpdate(updates);

      expect(result.email).toBeNull();
    });

    it('should not include email when explicitly set to undefined', () => {
      // When email is explicitly undefined, toClientUpdate doesn't include it
      // This is different from email: '' which converts to null
      const updates: Partial<Client> = { email: undefined };
      const result = toClientUpdate(updates);

      // The email key should not be present in the result
      expect('email' in result).toBe(false);
      expect(result.email).toBeUndefined();
    });

    it('should serialize loyaltyInfo update', () => {
      const loyaltyInfo: LoyaltyInfo = {
        tier: 'gold',
        pointsBalance: 750,
        lifetimePoints: 3000,
        referralCount: 5,
        rewardsRedeemed: 8,
      };
      const result = toClientUpdate({ loyaltyInfo });

      const loyaltyJson = result.loyalty_info as Record<string, unknown>;
      expect(loyaltyJson.tier).toBe('gold');
      expect(loyaltyJson.pointsBalance).toBe(750);
    });

    it('should serialize visitSummary update', () => {
      const visitSummary: VisitSummary = {
        totalVisits: 30,
        totalSpent: 1800,
        averageTicket: 60,
      };
      const result = toClientUpdate({ visitSummary });

      const visitJson = result.visit_summary as Record<string, unknown>;
      expect(visitJson.totalVisits).toBe(30);
      expect(visitJson.totalSpent).toBe(1800);
    });

    it('should serialize preferences update', () => {
      const preferences: ClientPreferences = {
        preferredStaffIds: ['staff-new'],
        beveragePreference: 'Water',
      };
      const result = toClientUpdate({ preferences });

      const prefsJson = result.preferences as Record<string, unknown>;
      expect(prefsJson.preferredStaffIds).toEqual(['staff-new']);
      expect(prefsJson.beveragePreference).toBe('Water');
    });

    it('should serialize tags update', () => {
      const tags: ClientTag[] = [{ id: 'tag-new', name: 'Updated', color: '#000000' }];
      const result = toClientUpdate({ tags });

      const tagsJson = result.tags as Array<Record<string, unknown>>;
      expect(tagsJson).toHaveLength(1);
      expect(tagsJson[0].name).toBe('Updated');
    });

    it('should serialize notes update', () => {
      const notes: ClientNote[] = [
        {
          id: 'note-new',
          date: '2024-01-25',
          content: 'Updated note',
          type: 'service',
          isPrivate: true,
          createdBy: 'staff-002',
        },
      ];
      const result = toClientUpdate({ notes });

      const notesJson = result.notes as Array<Record<string, unknown>>;
      expect(notesJson[0].content).toBe('Updated note');
      expect(notesJson[0].type).toBe('service');
      expect(notesJson[0].isPrivate).toBe(true);
    });

    it('should update syncStatus', () => {
      const result = toClientUpdate({ syncStatus: 'pending' });

      expect(result.sync_status).toBe('pending');
    });

    it('should return empty object for no updates', () => {
      const result = toClientUpdate({});

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  // ==================== toClients TESTS ====================

  describe('toClients', () => {
    it('should convert array of ClientRows', () => {
      const rows = [
        createMockClientRow({ id: 'client-001', first_name: 'John' }),
        createMockClientRow({ id: 'client-002', first_name: 'Jane' }),
        createMockClientRow({ id: 'client-003', first_name: 'Bob' }),
      ];
      const clients = toClients(rows);

      expect(clients).toHaveLength(3);
      expect(clients[0].id).toBe('client-001');
      expect(clients[0].firstName).toBe('John');
      expect(clients[1].id).toBe('client-002');
      expect(clients[1].firstName).toBe('Jane');
      expect(clients[2].id).toBe('client-003');
      expect(clients[2].firstName).toBe('Bob');
    });

    it('should return empty array for empty input', () => {
      const clients = toClients([]);

      expect(clients).toEqual([]);
    });

    it('should preserve all data through conversion', () => {
      const rows = [
        createMockClientRow({
          id: 'client-full',
          is_vip: true,
          loyalty_info: { tier: 'platinum', pointsBalance: 5000 } as Json,
          visit_summary: { totalVisits: 100, totalSpent: 10000 } as Json,
          tags: [{ id: 'tag-1', name: 'VIP', color: '#FFD700' }] as Json,
        }),
      ];
      const clients = toClients(rows);

      expect(clients[0].isVip).toBe(true);
      expect(clients[0].loyaltyInfo?.tier).toBe('platinum');
      expect(clients[0].loyaltyInfo?.pointsBalance).toBe(5000);
      expect(clients[0].visitSummary?.totalVisits).toBe(100);
      expect(clients[0].tags?.[0].name).toBe('VIP');
    });
  });

  // ==================== ROUND-TRIP TESTS ====================

  describe('round-trip data integrity', () => {
    it('should maintain data integrity through toClient -> toClientInsert cycle', () => {
      const originalRow = createMockClientRow({
        loyalty_info: {
          tier: 'gold',
          pointsBalance: 500,
          lifetimePoints: 2500,
          memberSince: '2023-01-01',
          referralCode: 'GOLD123',
          referralCount: 3,
          rewardsRedeemed: 5,
        } as Json,
        visit_summary: {
          totalVisits: 25,
          totalSpent: 1500,
          averageTicket: 60,
          lastVisitDate: '2024-01-15',
          favoriteService: 'Haircut',
          noShowCount: 1,
          lateCancelCount: 0,
        } as Json,
        preferences: {
          preferredStaffIds: ['staff-001'],
          beveragePreference: 'Coffee',
        } as Json,
        tags: [{ id: 'tag-1', name: 'Regular', color: '#00FF00' }] as Json,
        notes: [
          {
            id: 'note-1',
            date: '2024-01-10',
            content: 'Test note',
            type: 'general',
            isPrivate: false,
            createdBy: 'staff-001',
          },
        ] as Json,
      });

      // Convert to app type
      const client = toClient(originalRow);

      // Convert back to insert format
      const insertData = toClientInsert(client);

      // Verify key data is preserved
      expect(insertData.store_id).toBe(originalRow.store_id);
      expect(insertData.first_name).toBe(originalRow.first_name);
      expect(insertData.last_name).toBe(originalRow.last_name);
      expect(insertData.is_vip).toBe(originalRow.is_vip);

      const loyaltyJson = insertData.loyalty_info as Record<string, unknown>;
      expect(loyaltyJson.tier).toBe('gold');
      expect(loyaltyJson.pointsBalance).toBe(500);

      const visitJson = insertData.visit_summary as Record<string, unknown>;
      expect(visitJson.totalVisits).toBe(25);
      expect(visitJson.totalSpent).toBe(1500);

      const tagsJson = insertData.tags as Array<Record<string, unknown>>;
      expect(tagsJson[0].name).toBe('Regular');

      const notesJson = insertData.notes as Array<Record<string, unknown>>;
      expect(notesJson[0].content).toBe('Test note');
    });

    it('should handle sparse data through round-trip', () => {
      // Minimal client with only required fields
      const minimalRow = createMockClientRow({
        loyalty_info: null,
        visit_summary: null,
        preferences: null,
        tags: null,
        notes: null,
      });

      const client = toClient(minimalRow);
      const insertData = toClientInsert(client);

      expect(insertData.loyalty_info).toBeNull();
      expect(insertData.visit_summary).toBeNull();
      expect(insertData.preferences).toBeNull();
      expect(insertData.tags).toBeNull();
      expect(insertData.notes).toBeNull();
    });
  });

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('should handle numeric strings in JSON fields', () => {
      const row = createMockClientRow({
        loyalty_info: {
          tier: 'bronze',
          pointsBalance: '100', // string instead of number
          lifetimePoints: '500',
        } as unknown as Json,
        visit_summary: {
          totalVisits: '10',
          totalSpent: '250.50',
        } as unknown as Json,
      });
      const client = toClient(row);

      // Should be coerced to numbers
      expect(client.loyaltyInfo?.pointsBalance).toBe(100);
      expect(client.loyaltyInfo?.lifetimePoints).toBe(500);
      expect(client.visitSummary?.totalVisits).toBe(10);
      expect(client.visitSummary?.totalSpent).toBe(250.5);
    });

    it('should handle boolean strings in notes', () => {
      const row = createMockClientRow({
        notes: [
          {
            id: 'note-1',
            date: '2024-01-01',
            content: 'Test',
            type: 'general',
            isPrivate: 'true', // string instead of boolean
            createdBy: 'staff-1',
          },
        ] as unknown as Json,
      });
      const client = toClient(row);

      // String 'true' is truthy
      expect(client.notes?.[0].isPrivate).toBe(true);
    });

    it('should handle empty string first/last name', () => {
      const row = createMockClientRow({
        first_name: '',
        last_name: '',
      });
      const client = toClient(row);

      expect(client.firstName).toBe('');
      expect(client.lastName).toBe('');
      expect(client.name).toBe(''); // empty after trim
    });

    it('should handle special characters in text fields', () => {
      const row = createMockClientRow({
        first_name: "O'Brien",
        last_name: 'Smith-Jones',
        email: 'test+special@example.com',
      });
      const client = toClient(row);

      expect(client.firstName).toBe("O'Brien");
      expect(client.lastName).toBe('Smith-Jones');
      expect(client.email).toBe('test+special@example.com');
    });

    it('should handle unicode in names', () => {
      const row = createMockClientRow({
        first_name: '日本',
        last_name: '太郎',
      });
      const client = toClient(row);

      expect(client.firstName).toBe('日本');
      expect(client.lastName).toBe('太郎');
      expect(client.name).toBe('日本 太郎');
    });
  });
});
