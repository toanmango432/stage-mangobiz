/**
 * Unit Tests for Multi-Store Client Sharing Thunks
 *
 * Tests the multi-store async thunks:
 * - lookupEcosystemIdentity: Lookup client by hashed phone/email
 * - requestProfileLink: Request profile link between stores
 * - respondToLinkRequest: Approve or reject link requests
 * - fetchLinkedStores: Fetch stores linked to a client
 * - fetchSafetyProfile: Fetch unified safety profile
 * - optIntoEcosystem: Opt client into Mango ecosystem
 * - fetchCrossLocationVisits: Fetch visits to other org locations
 * - fetchOrgClientSharing: Fetch organization sharing settings
 * - updateOrgClientSharing: Update organization sharing settings
 * - getOrgWideLoyalty: Get combined loyalty points across org
 *
 * Phase 5 of Client Module: Multi-Store Client Sharing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { ClientsState } from '../types';
import type { ThunkDispatch, UnknownAction, AnyAction, Dispatch } from '@reduxjs/toolkit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestDispatch = ThunkDispatch<any, unknown, UnknownAction> & Dispatch<AnyAction>;

// ==================== MOCK SETUP ====================

// Define mock functions at module level for vi.mock hoisting
const mockSupabaseFrom = vi.fn();
const mockSupabaseFunctionsInvoke = vi.fn();

// Mock the Supabase client
vi.mock('../../../../services/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    functions: {
      invoke: (...args: unknown[]) => mockSupabaseFunctionsInvoke(...args),
    },
  },
}));

// Mock identity hash functions
vi.mock('../../../../utils/identityHash', () => ({
  normalizePhone: (phone: string) => `+1${phone.replace(/\D/g, '').slice(-10)}`,
  normalizeEmail: (email: string) => email.toLowerCase().trim(),
  hashIdentifier: vi.fn().mockImplementation(async (value: string) => `hashed_${value}`),
  hashPhone: vi.fn().mockImplementation(async (phone: string) => `hashed_phone_${phone.replace(/\D/g, '').slice(-10)}`),
  hashEmail: vi.fn().mockImplementation(async (email: string) => `hashed_email_${email.toLowerCase()}`),
}));

// Mock dataService
vi.mock('../../../../services/dataService', () => ({
  dataService: {
    clients: {
      getAll: vi.fn(),
      getById: vi.fn(),
      search: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock database modules
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
  },
  patchTestsDB: { getByClientId: vi.fn() },
  formResponsesDB: { getByClientId: vi.fn() },
  referralsDB: { getByReferrerId: vi.fn() },
  clientReviewsDB: { getByClientId: vi.fn() },
  loyaltyRewardsDB: { getByClientId: vi.fn() },
  reviewRequestsDB: { getByClientId: vi.fn() },
  customSegmentsDB: { getActive: vi.fn().mockResolvedValue([]) },
}));

// Mock auditLogger
vi.mock('../../../../services/audit/auditLogger', () => ({
  auditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import after mocking
import clientsReducer from '../slice';
import {
  lookupEcosystemIdentity,
  requestProfileLink,
  respondToLinkRequest,
  fetchLinkedStores,
  fetchSafetyProfile,
  optIntoEcosystem,
  fetchCrossLocationVisits,
  fetchOrgClientSharing,
  updateOrgClientSharing,
  getOrgWideLoyalty,
} from '../multiStoreThunks';
import { initialState } from '../types';
import { normalizePhone, normalizeEmail } from '../../../../utils/identityHash';

// ==================== TEST UTILITIES ====================

/**
 * Create a chainable mock for Supabase query builder
 */
function createQueryBuilderMock(finalResult: { data: unknown; error: unknown }) {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
    then: vi.fn().mockImplementation((cb) => cb(finalResult)),
  };
  // Make chain methods return the chain for chaining
  chain.insert.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.neq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
}

/**
 * Create a configured store for testing
 */
function createTestStore(
  preloadedState?: Partial<ClientsState>,
  authState?: {
    store?: { storeId: string; storeName: string };
    member?: { memberId: string; role: string };
  }
) {
  const store = configureStore({
    reducer: {
      clients: clientsReducer,
      auth: (state = {
        store: authState?.store || { storeId: 'store-001', storeName: 'Test Store' },
        member: authState?.member || { memberId: 'member-001', role: 'owner' },
      }) => state,
    },
    preloadedState: {
      clients: {
        ...initialState,
        ...preloadedState,
      },
      auth: {
        store: authState?.store || { storeId: 'store-001', storeName: 'Test Store' },
        member: authState?.member || { memberId: 'member-001', role: 'owner' },
      },
    },
  });

  return store as typeof store & {
    dispatch: TestDispatch;
  };
}

// ==================== IDENTITY HASHING TESTS ====================

describe('Identity Hashing Normalization', () => {
  it('should normalize phone numbers correctly', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');
    expect(normalizePhone('555.123.4567')).toBe('+15551234567');
    expect(normalizePhone('1-555-123-4567')).toBe('+15551234567');
    expect(normalizePhone('5551234567')).toBe('+15551234567');
  });

  it('should normalize email addresses correctly', () => {
    expect(normalizeEmail('Test@Email.com')).toBe('test@email.com');
    expect(normalizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    expect(normalizeEmail('already.normalized@email.org')).toBe('already.normalized@email.org');
  });
});

// ==================== lookupEcosystemIdentity TESTS ====================

describe('lookupEcosystemIdentity thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should lookup identity by phone successfully', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValue({
      data: {
        exists: true,
        canRequest: true,
        identityId: 'identity-001',
        linkedStoresCount: 2,
      },
      error: null,
    });

    const result = await store.dispatch(
      lookupEcosystemIdentity({ phone: '555-123-4567' })
    );

    expect(result.type).toBe('clients/lookupEcosystemIdentity/fulfilled');
    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('identity-lookup', {
      body: expect.objectContaining({
        hashedPhone: expect.stringContaining('hashed_phone'),
      }),
    });
  });

  it('should return not found when identity does not exist', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValue({
      data: {
        exists: false,
        canRequest: false,
      },
      error: null,
    });

    const result = await store.dispatch(
      lookupEcosystemIdentity({ email: 'test@example.com' })
    );

    expect(result.type).toBe('clients/lookupEcosystemIdentity/fulfilled');
    expect(result.payload).toEqual({ exists: false, canRequest: false });
  });

  it('should reject when neither phone nor email provided', async () => {
    const store = createTestStore();

    const result = await store.dispatch(lookupEcosystemIdentity({}));

    expect(result.type).toBe('clients/lookupEcosystemIdentity/rejected');
    expect(result.payload).toContain('phone or email must be provided');
  });
});

// ==================== requestProfileLink TESTS ====================

describe('requestProfileLink thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create profile link request successfully', async () => {
    const store = createTestStore();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    mockSupabaseFunctionsInvoke.mockResolvedValue({
      data: {
        requestId: 'request-001',
        expiresAt,
        success: true,
      },
      error: null,
    });

    const result = await store.dispatch(
      requestProfileLink({ identityId: 'identity-001' })
    );

    expect(result.type).toBe('clients/requestProfileLink/fulfilled');
    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('identity-request-link', {
      body: expect.objectContaining({
        requestingStoreId: 'store-001',
        requestingStoreName: 'Test Store',
        mangoIdentityId: 'identity-001',
      }),
    });
  });

  it('should reject when store info is not available', async () => {
    // Create a store with explicit null values for store session
    const storeWithNoSession = configureStore({
      reducer: {
        clients: clientsReducer,
        auth: () => ({
          store: null,
          member: { memberId: 'member-001', role: 'owner' },
        }),
      },
      preloadedState: {
        clients: initialState,
        auth: {
          store: null,
          member: { memberId: 'member-001', role: 'owner' },
        },
      },
    }) as ReturnType<typeof createTestStore>;

    const result = await storeWithNoSession.dispatch(
      requestProfileLink({ identityId: 'identity-001' })
    );

    expect(result.type).toBe('clients/requestProfileLink/rejected');
    expect(result.payload).toContain('Store information not available');
  });
});

// ==================== respondToLinkRequest TESTS ====================

describe('respondToLinkRequest thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should approve link request successfully', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValue({
      data: {
        success: true,
        linkId: 'link-001',
      },
      error: null,
    });

    const result = await store.dispatch(
      respondToLinkRequest({
        requestId: 'request-001',
        action: 'approve',
        localClientId: 'client-001',
      })
    );

    expect(result.type).toBe('clients/respondToLinkRequest/fulfilled');
    expect(result.payload).toEqual({ success: true, linkId: 'link-001' });
  });

  it('should reject link request successfully', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValue({
      data: {
        success: true,
      },
      error: null,
    });

    const result = await store.dispatch(
      respondToLinkRequest({
        requestId: 'request-001',
        action: 'reject',
      })
    );

    expect(result.type).toBe('clients/respondToLinkRequest/fulfilled');
    expect(result.payload).toEqual({ success: true, linkId: undefined });
  });
});

// ==================== fetchLinkedStores TESTS ====================

describe('fetchLinkedStores thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch linked stores successfully', async () => {
    const store = createTestStore();

    // Mock client lookup
    const clientQueryBuilder = createQueryBuilderMock({
      data: { mango_identity_id: 'identity-001' },
      error: null,
    });

    // Mock linked stores lookup
    const linkedStoresData = [
      {
        id: 'link-001',
        mango_identity_id: 'identity-001',
        store_id: 'store-001',
        store_name: 'Store 1',
        local_client_id: 'client-001',
        linked_at: '2025-01-01T00:00:00Z',
        linked_by: 'client',
        access_level: 'full',
      },
      {
        id: 'link-002',
        mango_identity_id: 'identity-001',
        store_id: 'store-002',
        store_name: 'Store 2',
        local_client_id: 'client-002',
        linked_at: '2025-01-02T00:00:00Z',
        linked_by: 'request_approved',
        access_level: 'basic',
      },
    ];

    const linkedStoresQueryBuilder = {
      ...createQueryBuilderMock({ data: linkedStoresData, error: null }),
      then: vi.fn().mockImplementation((cb) => cb({ data: linkedStoresData, error: null })),
    };

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clients') return clientQueryBuilder;
      if (table === 'linked_stores') return linkedStoresQueryBuilder;
      return clientQueryBuilder;
    });

    const result = await store.dispatch(fetchLinkedStores({ clientId: 'client-001' }));

    expect(result.type).toBe('clients/fetchLinkedStores/fulfilled');
    expect(Array.isArray(result.payload)).toBe(true);
  });

  it('should return empty array when client has no mango_identity_id', async () => {
    const store = createTestStore();

    const clientQueryBuilder = createQueryBuilderMock({
      data: { mango_identity_id: null },
      error: null,
    });

    mockSupabaseFrom.mockReturnValue(clientQueryBuilder);

    const result = await store.dispatch(fetchLinkedStores({ clientId: 'client-001' }));

    expect(result.type).toBe('clients/fetchLinkedStores/fulfilled');
    expect(result.payload).toEqual([]);
  });
});

// ==================== fetchSafetyProfile TESTS ====================

describe('fetchSafetyProfile thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch unified safety profile successfully', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValue({
      data: {
        safetyData: {
          allergies: ['Latex', 'Shellfish'],
          isBlocked: false,
          blockReasons: [],
          staffAlerts: [{ message: 'VIP client', createdAt: '2025-01-01T00:00:00Z', createdBy: 'staff-001' }],
          sources: [
            { storeId: 'store-001', storeName: 'Store 1', hasAllergies: true, isBlocked: false, hasStaffAlert: true },
          ],
        },
      },
      error: null,
    });

    const result = await store.dispatch(fetchSafetyProfile({ identityId: 'identity-001' }));

    expect(result.type).toBe('clients/fetchSafetyProfile/fulfilled');
    expect(result.payload).toHaveProperty('allergies');
    expect(result.payload).toHaveProperty('isBlocked');
    expect(result.payload).toHaveProperty('sources');
  });
});

// ==================== ORG SHARING PERMISSION TESTS ====================

describe('Org sharing permission checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow owner to update org sharing settings', async () => {
    const store = createTestStore({}, {
      store: { storeId: 'store-001', storeName: 'Test Store' },
      member: { memberId: 'member-001', role: 'owner' },
    });

    const queryBuilder = createQueryBuilderMock({ data: null, error: null });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      updateOrgClientSharing({
        organizationId: 'org-001',
        settings: {
          sharingMode: 'full',
          sharedCategories: {
            profiles: true,
            safetyData: true,
            visitHistory: true,
            staffNotes: true,
            loyaltyData: true,
            walletData: true,
          },
          loyaltyScope: 'organization',
          giftCardScope: 'organization',
          membershipScope: 'location',
          allowCrossLocationBooking: true,
        },
      })
    );

    expect(result.type).toBe('clients/updateOrgClientSharing/fulfilled');
  });

  it('should allow admin to update org sharing settings', async () => {
    const store = createTestStore({}, {
      store: { storeId: 'store-001', storeName: 'Test Store' },
      member: { memberId: 'member-001', role: 'admin' },
    });

    const queryBuilder = createQueryBuilderMock({ data: null, error: null });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      updateOrgClientSharing({
        organizationId: 'org-001',
        settings: {
          sharingMode: 'selective',
          sharedCategories: {
            profiles: true,
            safetyData: true,
            visitHistory: false,
            staffNotes: false,
            loyaltyData: false,
            walletData: false,
          },
          loyaltyScope: 'location',
          giftCardScope: 'location',
          membershipScope: 'location',
          allowCrossLocationBooking: false,
        },
      })
    );

    expect(result.type).toBe('clients/updateOrgClientSharing/fulfilled');
  });

  it('should reject staff from updating org sharing settings', async () => {
    const store = createTestStore({}, {
      store: { storeId: 'store-001', storeName: 'Test Store' },
      member: { memberId: 'member-001', role: 'staff' },
    });

    const result = await store.dispatch(
      updateOrgClientSharing({
        organizationId: 'org-001',
        settings: {
          sharingMode: 'full',
          sharedCategories: {
            profiles: true,
            safetyData: true,
            visitHistory: true,
            staffNotes: true,
            loyaltyData: true,
            walletData: true,
          },
          loyaltyScope: 'organization',
          giftCardScope: 'organization',
          membershipScope: 'location',
          allowCrossLocationBooking: true,
        },
      })
    );

    expect(result.type).toBe('clients/updateOrgClientSharing/rejected');
    expect(result.payload).toContain('Only organization owners and admins');
  });
});

// ==================== fetchOrgClientSharing TESTS ====================

describe('fetchOrgClientSharing thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch org sharing settings with defaults', async () => {
    const store = createTestStore();

    // Mock store lookup
    const storeQueryBuilder = createQueryBuilderMock({
      data: { organization_id: 'org-001' },
      error: null,
    });

    // Mock org lookup
    const orgQueryBuilder = createQueryBuilderMock({
      data: {
        client_sharing_settings: {
          sharingMode: 'selective',
          sharedCategories: { profiles: true },
        },
      },
      error: null,
    });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'stores') return storeQueryBuilder;
      if (table === 'organizations') return orgQueryBuilder;
      return storeQueryBuilder;
    });

    const result = await store.dispatch(fetchOrgClientSharing({}));

    expect(result.type).toBe('clients/fetchOrgClientSharing/fulfilled');
    const payload = result.payload as { sharingMode: string; sharedCategories: { safetyData: boolean } } | null;
    if (payload) {
      expect(payload.sharingMode).toBe('selective');
      // Safety data should always be true
      expect(payload.sharedCategories.safetyData).toBe(true);
    }
  });

  it('should return null when store is not in organization', async () => {
    const store = createTestStore();

    const storeQueryBuilder = createQueryBuilderMock({
      data: { organization_id: null },
      error: null,
    });

    mockSupabaseFrom.mockReturnValue(storeQueryBuilder);

    const result = await store.dispatch(fetchOrgClientSharing({}));

    expect(result.type).toBe('clients/fetchOrgClientSharing/fulfilled');
    expect(result.payload).toBeNull();
  });
});

// ==================== fetchCrossLocationVisits TESTS ====================

describe('fetchCrossLocationVisits thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when client has no organization', async () => {
    const store = createTestStore();

    const clientQueryBuilder = createQueryBuilderMock({
      data: { organization_id: null },
      error: null,
    });

    mockSupabaseFrom.mockReturnValue(clientQueryBuilder);

    const result = await store.dispatch(fetchCrossLocationVisits({ clientId: 'client-001' }));

    expect(result.type).toBe('clients/fetchCrossLocationVisits/fulfilled');
    expect(result.payload).toEqual([]);
  });
});

// ==================== getOrgWideLoyalty TESTS ====================

describe('getOrgWideLoyalty thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return local points when client not linked to ecosystem', async () => {
    const store = createTestStore();

    // Mock client lookup - no mango_identity_id
    const clientQueryBuilder = createQueryBuilderMock({
      data: { organization_id: 'org-001', mango_identity_id: null },
      error: null,
    });

    // Mock org lookup
    const orgQueryBuilder = createQueryBuilderMock({
      data: { client_sharing_settings: { loyaltyScope: 'organization' } },
      error: null,
    });

    // Mock loyalty balance
    const loyaltyQueryBuilder = createQueryBuilderMock({
      data: { points: 500 },
      error: null,
    });

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'clients') return clientQueryBuilder;
      if (table === 'organizations') return orgQueryBuilder;
      if (table === 'loyalty_balances') return loyaltyQueryBuilder;
      return clientQueryBuilder;
    });

    const result = await store.dispatch(getOrgWideLoyalty({ clientId: 'client-001' }));

    expect(result.type).toBe('clients/getOrgWideLoyalty/fulfilled');
    const payload = result.payload as { totalPoints: number; breakdown: unknown[] } | null;
    if (payload) {
      expect(payload.totalPoints).toBe(500);
      expect(payload.breakdown).toHaveLength(1);
    }
  });
});
