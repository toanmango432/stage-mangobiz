/**
 * Unit Tests for Client Merge Functionality
 *
 * Tests the mergeClientsInSupabase thunk, Redux state updates,
 * and related merge business logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { Client } from '../../../../types/client';
import type { SyncStatus } from '../../../../types/common';
import type { MergeClientOptions, MergeClientParams, ClientsState } from '../types';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

// Mock the Supabase client
const mockRpc = vi.fn();
const mockFunctionsInvoke = vi.fn();

vi.mock('../../../../services/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
  },
}));

// Mock the database modules
vi.mock('../../../../db/database', () => ({
  clientsDB: {
    getById: vi.fn(),
    getAll: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFiltered: vi.fn(),
    getStats: vi.fn(),
    block: vi.fn(),
    unblock: vi.fn(),
    setStaffAlert: vi.fn(),
    clearStaffAlert: vi.fn(),
    setVipStatus: vi.fn(),
    bulkUpdate: vi.fn(),
    bulkDelete: vi.fn(),
  },
  patchTestsDB: {
    getByClientId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  formResponsesDB: { getByClientId: vi.fn() },
  referralsDB: { getByReferrerId: vi.fn() },
  clientReviewsDB: { getByClientId: vi.fn() },
  loyaltyRewardsDB: { getByClientId: vi.fn() },
  reviewRequestsDB: { getByClientId: vi.fn() },
  customSegmentsDB: {
    getActive: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
    getByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
    getBySalonId: vi.fn(),
  },
}));

// Mock auditLogger
vi.mock('../../../../services/audit/auditLogger', () => ({
  auditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock dataService
const mockDataServiceGetById = vi.fn();
const mockDataServiceGetAll = vi.fn();

vi.mock('../../../../services/dataService', () => ({
  dataService: {
    clients: {
      getAll: () => mockDataServiceGetAll(),
      getById: (id: string) => mockDataServiceGetById(id),
      search: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import slice and thunks after mocking
import clientsReducer from '../slice';
import { mergeClientsInSupabase } from '../thunks';
import { initialState } from '../types';

// ==================== TEST UTILITIES ====================

/**
 * Create a mock Client for testing
 */
function createMockClient(overrides: Partial<Client> = {}): Client {
  const now = new Date().toISOString();
  const id = overrides.id || `client-${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    storeId: 'store-001',
    firstName: 'Test',
    lastName: 'Client',
    phone: '555-0000',
    email: `${id}@example.com`,
    isBlocked: false,
    isVip: false,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced' as SyncStatus,
    ...overrides,
  };
}

/**
 * Create a configured store for testing with proper async thunk support
 */
function createTestStore(preloadedState?: Partial<ClientsState>) {
  const store = configureStore({
    reducer: {
      clients: clientsReducer,
    },
    preloadedState: {
      clients: {
        ...initialState,
        ...preloadedState,
      },
    },
  });

  return store as typeof store & {
    dispatch: ThunkDispatch<{ clients: ClientsState }, unknown, UnknownAction>;
  };
}

// ==================== MERGE THUNK TESTS ====================

describe('mergeClientsInSupabase thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should dispatch correctly with valid parameters', async () => {
    const primaryClient = createMockClient({ id: 'primary-001', firstName: 'Primary', lastName: 'Client' });
    const secondaryClient = createMockClient({ id: 'secondary-001', firstName: 'Secondary', lastName: 'Client' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    // Mock successful RPC response
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        merged_counts: { appointments: 5, tickets: 3, transactions: 2 },
        primary_client: primaryClient,
      },
      error: null,
    });

    // Mock fetching updated primary client
    mockDataServiceGetById.mockResolvedValueOnce({
      ...primaryClient,
      loyaltyInfo: {
        tier: 'gold',
        pointsBalance: 1500,
        lifetimePoints: 3000,
        referralCount: 2,
        rewardsRedeemed: 1,
      },
    });

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    const result = await store.dispatch(mergeClientsInSupabase(params));

    expect(result.type).toBe('clients/mergeInSupabase/fulfilled');
    expect(mockRpc).toHaveBeenCalledWith('merge_clients', {
      p_primary_id: 'primary-001',
      p_secondary_id: 'secondary-001',
      p_options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      p_merged_by: 'staff-001',
    });
  });

  it('should reject when RPC returns error', async () => {
    const primaryClient = createMockClient({ id: 'primary-001' });
    const secondaryClient = createMockClient({ id: 'secondary-001' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    // Mock RPC error
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Cannot merge a client with itself' },
    });

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    const result = await store.dispatch(mergeClientsInSupabase(params));

    expect(result.type).toBe('clients/mergeInSupabase/rejected');
    expect((result as unknown as { error: { message: string } }).error.message).toBe('Cannot merge a client with itself');
  });

  it('should reject when RPC returns success: false', async () => {
    const primaryClient = createMockClient({ id: 'primary-001' });
    const secondaryClient = createMockClient({ id: 'secondary-001' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    // Mock RPC returning success: false
    mockRpc.mockResolvedValueOnce({
      data: { success: false },
      error: null,
    });

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    const result = await store.dispatch(mergeClientsInSupabase(params));

    expect(result.type).toBe('clients/mergeInSupabase/rejected');
  });
});

// ==================== REDUX STATE UPDATE TESTS ====================

describe('Redux state updates after merge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update primary client in state after successful merge', async () => {
    const primaryClient = createMockClient({
      id: 'primary-001',
      firstName: 'Primary',
      lastName: 'Client',
      loyaltyInfo: {
        tier: 'bronze',
        pointsBalance: 100,
        lifetimePoints: 100,
        referralCount: 0,
        rewardsRedeemed: 0,
      },
    });
    const secondaryClient = createMockClient({
      id: 'secondary-001',
      firstName: 'Secondary',
      lastName: 'Client',
      loyaltyInfo: {
        tier: 'bronze',
        pointsBalance: 200,
        lifetimePoints: 200,
        referralCount: 1,
        rewardsRedeemed: 0,
      },
    });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    const updatedPrimary = {
      ...primaryClient,
      loyaltyInfo: {
        tier: 'silver' as const,
        pointsBalance: 300,
        lifetimePoints: 300,
        referralCount: 1,
        rewardsRedeemed: 0,
      },
    };

    // Mock successful RPC response
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        merged_counts: { appointments: 5, tickets: 3, transactions: 2 },
        primary_client: updatedPrimary,
      },
      error: null,
    });

    // Mock fetching updated primary client
    mockDataServiceGetById.mockResolvedValueOnce(updatedPrimary);

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    await store.dispatch(mergeClientsInSupabase(params));

    const state = store.getState().clients;
    const primaryInState = state.items.find((c: Client) => c.id === 'primary-001');

    expect(primaryInState).toBeDefined();
    expect(primaryInState?.loyaltyInfo?.pointsBalance).toBe(300);
    expect(primaryInState?.loyaltyInfo?.tier).toBe('silver');
  });

  it('should remove secondary client from state after successful merge', async () => {
    const primaryClient = createMockClient({ id: 'primary-001' });
    const secondaryClient = createMockClient({ id: 'secondary-001' });
    const otherClient = createMockClient({ id: 'other-001' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient, otherClient],
      total: 3,
    });

    // Mock successful RPC response
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        merged_counts: { appointments: 0, tickets: 0, transactions: 0 },
        primary_client: primaryClient,
      },
      error: null,
    });

    // Mock fetching updated primary client
    mockDataServiceGetById.mockResolvedValueOnce(primaryClient);

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    await store.dispatch(mergeClientsInSupabase(params));

    const state = store.getState().clients;

    // Secondary client should be removed
    const secondaryInState = state.items.find((c: Client) => c.id === 'secondary-001');
    expect(secondaryInState).toBeUndefined();

    // Primary and other clients should still exist
    const primaryInState = state.items.find((c: Client) => c.id === 'primary-001');
    const otherInState = state.items.find((c: Client) => c.id === 'other-001');
    expect(primaryInState).toBeDefined();
    expect(otherInState).toBeDefined();

    // Total should be decremented
    expect(state.total).toBe(2);
  });

  it('should decrement total count after merge', async () => {
    const primaryClient = createMockClient({ id: 'primary-001' });
    const secondaryClient = createMockClient({ id: 'secondary-001' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    // Mock successful RPC response
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        merged_counts: {},
        primary_client: primaryClient,
      },
      error: null,
    });

    mockDataServiceGetById.mockResolvedValueOnce(primaryClient);

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: false,
        mergeLoyalty: false,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    await store.dispatch(mergeClientsInSupabase(params));

    const state = store.getState().clients;
    expect(state.total).toBe(1);
  });

  it('should set error state when merge fails', async () => {
    const primaryClient = createMockClient({ id: 'primary-001' });
    const secondaryClient = createMockClient({ id: 'secondary-001' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    // Mock RPC error
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' },
    });

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    await store.dispatch(mergeClientsInSupabase(params));

    const state = store.getState().clients;
    expect(state.error).toBe('Database connection failed');
    expect(state.saving).toBe(false);
  });

  it('should set saving to true during merge operation', async () => {
    const primaryClient = createMockClient({ id: 'primary-001' });
    const secondaryClient = createMockClient({ id: 'secondary-001' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    // Create a promise that we can control
    let resolveRpc: (value: unknown) => void;
    const rpcPromise = new Promise((resolve) => {
      resolveRpc = resolve;
    });
    mockRpc.mockReturnValueOnce(rpcPromise);

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    // Start the dispatch but don't await it
    const dispatchPromise = store.dispatch(mergeClientsInSupabase(params));

    // Check state while operation is pending
    // Note: Due to async nature, we need to wait a tick
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(store.getState().clients.saving).toBe(true);

    // Resolve the RPC call
    resolveRpc!({
      data: {
        success: true,
        merged_counts: {},
        primary_client: primaryClient,
      },
      error: null,
    });

    mockDataServiceGetById.mockResolvedValueOnce(primaryClient);

    await dispatchPromise;

    expect(store.getState().clients.saving).toBe(false);
  });
});

// ==================== ERROR HANDLING TESTS ====================

describe('Error handling for invalid client IDs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle missing primary client in RPC response', async () => {
    const primaryClient = createMockClient({ id: 'primary-001' });
    const secondaryClient = createMockClient({ id: 'secondary-001' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    // Mock successful RPC but dataService returns null
    mockRpc.mockResolvedValueOnce({
      data: {
        success: true,
        merged_counts: {},
        primary_client: primaryClient,
      },
      error: null,
    });

    mockDataServiceGetById.mockResolvedValueOnce(null);

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    const result = await store.dispatch(mergeClientsInSupabase(params));

    expect(result.type).toBe('clients/mergeInSupabase/rejected');
    expect((result as unknown as { error: { message: string } }).error.message).toBe(
      'Failed to fetch updated primary client after merge'
    );
  });

  it('should handle RPC returning empty error message', async () => {
    const primaryClient = createMockClient({ id: 'primary-001' });
    const secondaryClient = createMockClient({ id: 'secondary-001' });

    const store = createTestStore({
      items: [primaryClient, secondaryClient],
      total: 2,
    });

    // Mock RPC error with empty message
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: '' },
    });

    const params: MergeClientParams = {
      primaryClientId: 'primary-001',
      secondaryClientId: 'secondary-001',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-001',
    };

    const result = await store.dispatch(mergeClientsInSupabase(params));

    expect(result.type).toBe('clients/mergeInSupabase/rejected');
    // Should use fallback message when error.message is empty
    expect((result as unknown as { error: { message: string } }).error.message).toBe('Failed to merge clients');
  });
});

// ==================== MERGE OPTIONS TESTS ====================

describe('MergeClientOptions validation', () => {
  it('should accept all merge options as true', () => {
    const options: MergeClientOptions = {
      mergeNotes: true,
      mergeLoyalty: true,
      mergePreferences: true,
      mergeAlerts: true,
    };

    expect(options.mergeNotes).toBe(true);
    expect(options.mergeLoyalty).toBe(true);
    expect(options.mergePreferences).toBe(true);
    expect(options.mergeAlerts).toBe(true);
  });

  it('should accept all merge options as false', () => {
    const options: MergeClientOptions = {
      mergeNotes: false,
      mergeLoyalty: false,
      mergePreferences: false,
      mergeAlerts: false,
    };

    expect(options.mergeNotes).toBe(false);
    expect(options.mergeLoyalty).toBe(false);
    expect(options.mergePreferences).toBe(false);
    expect(options.mergeAlerts).toBe(false);
  });

  it('should accept mixed merge options', () => {
    const options: MergeClientOptions = {
      mergeNotes: true,
      mergeLoyalty: false,
      mergePreferences: true,
      mergeAlerts: false,
    };

    expect(options.mergeNotes).toBe(true);
    expect(options.mergeLoyalty).toBe(false);
    expect(options.mergePreferences).toBe(true);
    expect(options.mergeAlerts).toBe(false);
  });
});

describe('MergeClientParams structure', () => {
  it('should have all required fields', () => {
    const params: MergeClientParams = {
      primaryClientId: 'client-123',
      secondaryClientId: 'client-456',
      options: {
        mergeNotes: true,
        mergeLoyalty: true,
        mergePreferences: false,
        mergeAlerts: false,
      },
      mergedBy: 'staff-789',
    };

    expect(params.primaryClientId).toBe('client-123');
    expect(params.secondaryClientId).toBe('client-456');
    expect(params.options).toBeDefined();
    expect(params.mergedBy).toBe('staff-789');
  });
});
