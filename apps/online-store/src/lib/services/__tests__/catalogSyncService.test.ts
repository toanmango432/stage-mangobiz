import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ─── Supabase Mock Setup ─────────────────────────────────────────────────────
// Must mock before any import of catalogSyncService

/**
 * We mock the entire catalogSyncService module. This is necessary because:
 * 1. The Supabase client is created at module level based on env vars
 * 2. vi.stubEnv doesn't run early enough for import.meta.env checks
 * 3. The module's internal `supabase` is null without real env vars
 *
 * Strategy: Mock @supabase/supabase-js createClient AND set import.meta.env
 * via vi.hoisted to ensure env vars are set before module evaluation.
 */

// Use vi.hoisted to define mock fns before module code runs
const { mockFrom, setupChain, setupMultiCallChain } = vi.hoisted(() => {
  // Set process.env so Vitest populates import.meta.env.VITE_*
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

  const mockFrom = vi.fn();

  function createChainThat(resolveWith: { data?: unknown; error?: unknown }) {
    // In Supabase JS client, every chain method returns a thenable builder.
    // Any method can be the terminal call (awaited).
    // We create a proxy-like chain where every method returns the chain
    // and the chain itself resolves to the expected result when awaited.
    const ch: Record<string, Mock> & { then?: unknown } = {};
    const self = () => ch;
    ch.select = vi.fn(self);
    ch.insert = vi.fn(self);
    ch.update = vi.fn(self);
    ch.upsert = vi.fn(self);
    ch.delete = vi.fn(self);
    ch.eq = vi.fn(self);
    ch.in = vi.fn(self);
    ch.order = vi.fn(self);
    ch.single = vi.fn(self);
    // Make the chain thenable so any position can be awaited
    ch.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
      return Promise.resolve(resolveWith).then(resolve, reject);
    };
    return ch;
  }

  function setupChain(result: { data?: unknown; error?: unknown }) {
    const ch = createChainThat(result);
    mockFrom.mockReturnValue(ch);
    return ch;
  }

  function setupMultiCallChain(calls: Array<{ result: { data?: unknown; error?: unknown } }>) {
    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const config = calls[callIndex] || calls[calls.length - 1];
      callIndex++;
      return createChainThat(config.result);
    });
  }

  return { mockFrom, setupChain, setupMultiCallChain };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ─── Import Service Functions (after mocks) ──────────────────────────────────

import {
  getCategories,
  createService,
  updateService,
  deleteService,
  getGiftCardConfig,
  updateGiftCardConfig,
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  getProductById,
  getMembershipPlanById,
  bulkDeleteProducts,
  bulkDeleteServices,
  bulkDeleteMembershipPlans,
  clearCache,
} from '../catalogSyncService';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const STORE_ID = 'store-123';
const TENANT_ID = 'tenant-1';

const mockCategoryRow = {
  id: 'cat-1',
  tenant_id: 'tenant-1',
  store_id: STORE_ID,
  location_id: null,
  name: 'Manicure',
  description: 'Nail care services',
  color: '#FF5733',
  icon: 'nail',
  display_order: 1,
  is_active: true,
  parent_category_id: null,
  show_online_booking: true,
  is_deleted: false,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockServiceRow = {
  id: 'svc-1',
  tenant_id: 'tenant-1',
  store_id: STORE_ID,
  location_id: null,
  category_id: 'cat-1',
  name: 'Gel Manicure',
  description: 'Full gel manicure service',
  sku: null,
  pricing_type: 'fixed' as const,
  price: 45,
  price_max: null,
  cost: null,
  taxable: true,
  duration: 60,
  extra_time: null,
  extra_time_type: null,
  aftercare_instructions: null,
  requires_patch_test: false,
  has_variants: false,
  variant_count: 0,
  all_staff_can_perform: true,
  booking_availability: 'both' as const,
  online_booking_enabled: true,
  requires_deposit: false,
  deposit_amount: null,
  deposit_percentage: null,
  online_booking_buffer_minutes: null,
  advance_booking_days_min: null,
  advance_booking_days_max: null,
  rebook_reminder_days: null,
  turn_weight: null,
  commission_rate: null,
  color: null,
  images: null,
  tags: ['gel', 'manicure'],
  status: 'active' as const,
  display_order: 1,
  show_price_online: true,
  allow_custom_duration: false,
  archived_at: null,
  archived_by: null,
  is_deleted: false,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockGiftCardSettingsRow = {
  id: 'gc-settings-1',
  tenant_id: 'tenant-1',
  store_id: STORE_ID,
  location_id: null,
  allow_custom_amount: true,
  min_amount: 25,
  max_amount: 500,
  default_expiration_days: 365,
  online_enabled: true,
  email_delivery_enabled: true,
  sync_status: 'synced' as const,
  version: 1,
  vector_clock: {},
  last_synced_version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by: null,
  created_by_device: null,
  last_modified_by: null,
  last_modified_by_device: null,
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
  deleted_by_device: null,
  tombstone_expires_at: null,
};

const mockDenominationRows = [
  {
    id: 'denom-1',
    tenant_id: 'tenant-1',
    store_id: STORE_ID,
    location_id: null,
    amount: 25,
    label: '$25',
    is_active: true,
    display_order: 0,
    sync_status: 'synced' as const,
    version: 1,
    vector_clock: {},
    last_synced_version: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: null,
    created_by_device: null,
    last_modified_by: null,
    last_modified_by_device: null,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    deleted_by_device: null,
    tombstone_expires_at: null,
  },
  {
    id: 'denom-2',
    tenant_id: 'tenant-1',
    store_id: STORE_ID,
    location_id: null,
    amount: 50,
    label: '$50',
    is_active: true,
    display_order: 1,
    sync_status: 'synced' as const,
    version: 1,
    vector_clock: {},
    last_synced_version: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: null,
    created_by_device: null,
    last_modified_by: null,
    last_modified_by_device: null,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    deleted_by_device: null,
    tombstone_expires_at: null,
  },
];

const mockMembershipPlanRow = {
  id: 'plan-1',
  tenant_id: 'tenant-1',
  store_id: STORE_ID,
  location_id: null,
  name: 'premium',
  display_name: 'Premium Plan',
  price_monthly: 99,
  description: 'Premium membership with benefits',
  tagline: 'Best value for regulars',
  image_url: null,
  badge_icon: 'star',
  color: '#FFD700',
  perks: ['10% off services', 'Priority booking'],
  features: { discountPercentage: 10, priorityBooking: true },
  rules: { minimumCommitmentMonths: 3 },
  is_popular: true,
  is_active: true,
  sort_order: 1,
  sync_status: 'synced' as const,
  version: 1,
  vector_clock: {},
  last_synced_version: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by: null,
  created_by_device: null,
  last_modified_by: null,
  last_modified_by_device: null,
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
  deleted_by_device: null,
  tombstone_expires_at: null,
};

const mockProductRow = {
  id: 'prod-1',
  store_id: STORE_ID,
  category_id: 'pcat-1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product',
  short_description: null,
  price: 29.99,
  compare_at_price: null,
  cost_price: 10,
  sku: 'TP-001',
  barcode: null,
  track_inventory: true,
  stock_quantity: 50,
  low_stock_threshold: 5,
  allow_backorder: false,
  images: [{ url: 'https://example.com/img.jpg', position: 0 }],
  thumbnail_url: null,
  weight: null,
  weight_unit: null,
  dimensions: null,
  has_variants: false,
  variant_options: null,
  meta_title: null,
  meta_description: null,
  is_active: true,
  is_featured: false,
  show_online: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('catalogSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
    // Reset localStorage mock (provided by setup.ts)
    (localStorage.getItem as Mock).mockReturnValue(null);
    (localStorage.setItem as Mock).mockImplementation(() => {});
    (localStorage.removeItem as Mock).mockImplementation(() => {});
  });

  // ─── getCategories ──────────────────────────────────────────────────────────

  describe('getCategories', () => {
    it('should return properly adapted categories from Supabase', async () => {
      setupChain({ data: [mockCategoryRow], error: null });

      const result = await getCategories(STORE_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'cat-1',
        name: 'Manicure',
        color: '#FF5733',
        icon: 'nail',
        displayOrder: 1,
      });
      expect(mockFrom).toHaveBeenCalledWith('service_categories');
    });

    it('should return empty array when no categories found', async () => {
      setupChain({ data: [], error: null });

      const result = await getCategories(STORE_ID);
      expect(result).toEqual([]);
    });

    it('should throw on Supabase error', async () => {
      setupChain({ data: null, error: { message: 'Network error', code: 'NETWORK' } });

      await expect(getCategories(STORE_ID)).rejects.toThrow();
    });
  });

  // ─── createService ──────────────────────────────────────────────────────────

  describe('createService', () => {
    it('should insert into menu_services and return adapted service', async () => {
      setupChain({ data: mockServiceRow, error: null });

      const newService = {
        name: 'Gel Manicure',
        category: 'cat-1',
        description: 'Full gel manicure service',
        duration: 60,
        basePrice: 45,
        price: 45,
        showOnline: true,
        showPriceOnline: true,
        hasVariants: false,
        addOns: [],
        tags: ['gel', 'manicure'],
        requiresDeposit: false,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
      };

      const result = await createService(STORE_ID, TENANT_ID, newService);

      expect(result.id).toBe('svc-1');
      expect(result.name).toBe('Gel Manicure');
      expect(result.basePrice).toBe(45);
      expect(mockFrom).toHaveBeenCalledWith('menu_services');
    });

    it('should throw on Supabase insert error', async () => {
      setupChain({ data: null, error: { message: 'Insert failed' } });

      await expect(
        createService(STORE_ID, TENANT_ID, {
          name: 'Test',
          category: 'cat-1',
          description: '',
          duration: 30,
          basePrice: 0,
          price: 0,
          showOnline: true,
          showPriceOnline: true,
          hasVariants: false,
          addOns: [],
          tags: [],
          requiresDeposit: false,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
        })
      ).rejects.toThrow('Failed to create service: Insert failed');
    });

    it('should invalidate services cache after creation', async () => {
      setupChain({ data: mockServiceRow, error: null });

      await createService(STORE_ID, TENANT_ID, {
        name: 'Gel Manicure',
        category: 'cat-1',
        description: '',
        duration: 60,
        basePrice: 45,
        price: 45,
        showOnline: true,
        showPriceOnline: true,
        hasVariants: false,
        addOns: [],
        tags: [],
        requiresDeposit: false,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_services_v2');
    });
  });

  // ─── updateService ──────────────────────────────────────────────────────────

  describe('updateService', () => {
    it('should update menu_services row and return adapted service', async () => {
      const updatedRow = { ...mockServiceRow, name: 'Updated Manicure', price: 55 };
      setupChain({ data: updatedRow, error: null });

      const result = await updateService('svc-1', { name: 'Updated Manicure', basePrice: 55 });

      expect(result.name).toBe('Updated Manicure');
      expect(result.basePrice).toBe(55);
      expect(mockFrom).toHaveBeenCalledWith('menu_services');
    });

    it('should throw on Supabase update error', async () => {
      setupChain({ data: null, error: { message: 'Update failed' } });

      await expect(updateService('svc-1', { name: 'Test' })).rejects.toThrow(
        'Failed to update service: Update failed'
      );
    });

    it('should invalidate services cache after update', async () => {
      setupChain({ data: mockServiceRow, error: null });

      await updateService('svc-1', { name: 'Test' });

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_services_v2');
    });
  });

  // ─── deleteService ──────────────────────────────────────────────────────────

  describe('deleteService', () => {
    it('should soft-delete by setting is_deleted = true', async () => {
      setupChain({ data: null, error: null });

      await deleteService('svc-1');

      expect(mockFrom).toHaveBeenCalledWith('menu_services');
    });

    it('should throw on Supabase delete error', async () => {
      setupChain({ data: null, error: { message: 'Delete failed' } });

      await expect(deleteService('svc-1')).rejects.toThrow('Failed to delete service: Delete failed');
    });

    it('should invalidate services cache after deletion', async () => {
      setupChain({ data: null, error: null });

      await deleteService('svc-1');

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_services_v2');
    });
  });

  // ─── getGiftCardConfig ──────────────────────────────────────────────────────

  describe('getGiftCardConfig', () => {
    it('should combine settings and denominations into GiftCardConfig', async () => {
      setupMultiCallChain([
        { result: { data: mockGiftCardSettingsRow, error: null } },
        { result: { data: mockDenominationRows, error: null } },
      ]);

      const result = await getGiftCardConfig(STORE_ID);

      expect(result).not.toBeNull();
      expect(result!.enabled).toBe(true);
      expect(result!.presetAmounts).toEqual([25, 50]);
      expect(result!.allowCustomAmounts).toBe(true);
      expect(result!.customAmountMin).toBe(25);
      expect(result!.customAmountMax).toBe(500);
      expect(result!.expiryMonths).toBe(12); // 365 / 30 rounded
    });

    it('should return null when no settings row exists (PGRST116)', async () => {
      setupMultiCallChain([
        { result: { data: null, error: { code: 'PGRST116', message: 'No rows' } } },
      ]);

      const result = await getGiftCardConfig(STORE_ID);
      expect(result).toBeNull();
    });

    it('should throw on non-PGRST116 settings error', async () => {
      setupMultiCallChain([
        { result: { data: null, error: { code: 'OTHER', message: 'DB error' } } },
      ]);

      await expect(getGiftCardConfig(STORE_ID)).rejects.toThrow(
        'Failed to fetch gift card settings: DB error'
      );
    });
  });

  // ─── updateGiftCardConfig ────────────────────────────────────────────────────

  describe('updateGiftCardConfig', () => {
    it('should upsert settings and replace denominations', async () => {
      setupMultiCallChain([
        // 1. Upsert settings
        { result: { data: mockGiftCardSettingsRow, error: null } },
        // 2. Insert new denominations (swap pattern: insert first)
        { result: { data: mockDenominationRows, error: null } },
        // 3. Soft-delete old denominations
        { result: { data: null, error: null } },
      ]);

      const config = {
        enabled: true,
        presetAmounts: [25, 50],
        allowCustomAmounts: true,
        customAmountMin: 25,
        customAmountMax: 500,
        expiryMonths: 12,
      };

      const result = await updateGiftCardConfig(STORE_ID, TENANT_ID, config);

      expect(result.enabled).toBe(true);
      expect(result.presetAmounts).toEqual([25, 50]);
    });

    it('should throw on settings upsert error', async () => {
      setupMultiCallChain([
        { result: { data: null, error: { message: 'Upsert failed' } } },
      ]);

      await expect(
        updateGiftCardConfig(STORE_ID, TENANT_ID, { enabled: true })
      ).rejects.toThrow('Failed to update gift card settings: Upsert failed');
    });

    it('should invalidate gift card cache after update', async () => {
      setupMultiCallChain([
        // 1. Upsert settings
        { result: { data: mockGiftCardSettingsRow, error: null } },
        // 2. Soft-delete old denominations (no insert since presetAmounts is empty)
        { result: { data: null, error: null } },
      ]);

      await updateGiftCardConfig(STORE_ID, TENANT_ID, { enabled: true, presetAmounts: [] });

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_giftcard_v2');
    });
  });

  // ─── getMembershipPlans ─────────────────────────────────────────────────────

  describe('getMembershipPlans', () => {
    it('should return properly adapted membership plans', async () => {
      setupChain({ data: [mockMembershipPlanRow], error: null });

      const result = await getMembershipPlans(STORE_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('plan-1');
      expect(result[0].name).toBe('premium');
      expect(result[0].displayName).toBe('Premium Plan');
      expect(result[0].priceMonthly).toBe(99);
      expect(result[0].perks).toEqual(['10% off services', 'Priority booking']);
      expect(result[0].isPopular).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('membership_plans');
    });

    it('should return empty array when no plans found', async () => {
      setupChain({ data: [], error: null });

      const result = await getMembershipPlans(STORE_ID);
      expect(result).toEqual([]);
    });

    it('should throw on Supabase error', async () => {
      setupChain({ data: null, error: { message: 'Fetch failed' } });

      await expect(getMembershipPlans(STORE_ID)).rejects.toThrow(
        'Failed to fetch membership plans: Fetch failed'
      );
    });

    it('should cache results after successful fetch', async () => {
      setupChain({ data: [mockMembershipPlanRow], error: null });

      await getMembershipPlans(STORE_ID);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'catalog_memberships_v2',
        expect.any(String)
      );
    });
  });

  // ─── createMembershipPlan ────────────────────────────────────────────────────

  describe('createMembershipPlan', () => {
    it('should insert into membership_plans and return adapted plan', async () => {
      setupChain({ data: mockMembershipPlanRow, error: null });

      const newPlan = {
        name: 'premium',
        displayName: 'Premium Plan',
        priceMonthly: 99,
        description: 'Premium membership with benefits',
        tagline: 'Best value for regulars',
        imageUrl: '',
        badgeIcon: 'star',
        color: '#FFD700',
        perks: ['10% off services', 'Priority booking'],
        features: { discountPercentage: 10, priorityBooking: true },
        rules: { minimumCommitmentMonths: 3 },
        isPopular: true,
        isActive: true,
        sortOrder: 1,
      };

      const result = await createMembershipPlan(STORE_ID, TENANT_ID, newPlan);

      expect(result.id).toBe('plan-1');
      expect(result.displayName).toBe('Premium Plan');
      expect(mockFrom).toHaveBeenCalledWith('membership_plans');
    });

    it('should throw on insert error', async () => {
      setupChain({ data: null, error: { message: 'Insert failed' } });

      await expect(
        createMembershipPlan(STORE_ID, TENANT_ID, {
          name: 'basic',
          displayName: 'Basic',
          priceMonthly: 29,
          description: '',
          tagline: '',
          imageUrl: '',
          badgeIcon: '',
          color: '',
          perks: [],
          features: {},
          rules: {},
          isPopular: false,
          isActive: true,
          sortOrder: 1,
        })
      ).rejects.toThrow('Failed to create membership plan: Insert failed');
    });

    it('should invalidate membership cache after creation', async () => {
      setupChain({ data: mockMembershipPlanRow, error: null });

      await createMembershipPlan(STORE_ID, TENANT_ID, {
        name: 'premium',
        displayName: 'Premium Plan',
        priceMonthly: 99,
        description: '',
        tagline: '',
        imageUrl: '',
        badgeIcon: '',
        color: '',
        perks: [],
        features: {},
        rules: {},
        isPopular: false,
        isActive: true,
        sortOrder: 1,
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_memberships_v2');
    });
  });

  // ─── updateMembershipPlan ───────────────────────────────────────────────────

  describe('updateMembershipPlan', () => {
    it('should update membership_plans row and return adapted plan', async () => {
      const updatedRow = { ...mockMembershipPlanRow, display_name: 'Updated Plan', price_monthly: 149 };
      setupChain({ data: updatedRow, error: null });

      const result = await updateMembershipPlan('plan-1', {
        displayName: 'Updated Plan',
        priceMonthly: 149,
      });

      expect(result.displayName).toBe('Updated Plan');
      expect(result.priceMonthly).toBe(149);
      expect(mockFrom).toHaveBeenCalledWith('membership_plans');
    });

    it('should throw on update error', async () => {
      setupChain({ data: null, error: { message: 'Update failed' } });

      await expect(
        updateMembershipPlan('plan-1', { displayName: 'Test' })
      ).rejects.toThrow('Failed to update membership plan: Update failed');
    });

    it('should invalidate membership cache after update', async () => {
      setupChain({ data: mockMembershipPlanRow, error: null });

      await updateMembershipPlan('plan-1', { displayName: 'Test' });

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_memberships_v2');
    });
  });

  // ─── deleteMembershipPlan ───────────────────────────────────────────────────

  describe('deleteMembershipPlan', () => {
    it('should soft-delete by setting is_deleted = true', async () => {
      setupChain({ data: null, error: null });

      await deleteMembershipPlan('plan-1');

      expect(mockFrom).toHaveBeenCalledWith('membership_plans');
    });

    it('should throw on delete error', async () => {
      setupChain({ data: null, error: { message: 'Delete failed' } });

      await expect(deleteMembershipPlan('plan-1')).rejects.toThrow(
        'Failed to delete membership plan: Delete failed'
      );
    });

    it('should invalidate membership cache after deletion', async () => {
      setupChain({ data: null, error: null });

      await deleteMembershipPlan('plan-1');

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_memberships_v2');
    });
  });

  // ─── Cache Behavior ─────────────────────────────────────────────────────────

  describe('cache behavior', () => {
    it('clearCache removes all cache keys', () => {
      clearCache();

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_services_v2');
      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_categories_v2');
      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_giftcard_v2');
      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_memberships_v2');
      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_addons_v2');
      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_sync_timestamp');
    });

    it('getMembershipPlans uses cached data when available', async () => {
      const cachedData = {
        data: [{ id: 'cached-plan', name: 'Cached' }],
        timestamp: Date.now(), // Fresh cache
      };
      (localStorage.getItem as Mock).mockReturnValue(JSON.stringify(cachedData));

      const result = await getMembershipPlans(STORE_ID);

      // Should return cached data without calling Supabase
      expect(result).toEqual(cachedData.data);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('getCategories uses cached data when available', async () => {
      const cachedData = {
        data: [{ id: 'cached-cat', name: 'Cached Category', color: '#000', displayOrder: 0 }],
        timestamp: Date.now(),
      };
      (localStorage.getItem as Mock).mockReturnValue(JSON.stringify(cachedData));

      const result = await getCategories(STORE_ID);

      expect(result).toEqual(cachedData.data);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('getMembershipPlans skips expired cache and fetches from Supabase', async () => {
      const expiredCache = {
        data: [{ id: 'old-plan', name: 'Old' }],
        timestamp: Date.now() - 10 * 60 * 1000, // 10 min ago (expired)
      };
      (localStorage.getItem as Mock).mockImplementation((key: string) => {
        if (key === 'catalog_memberships_v2') return JSON.stringify(expiredCache);
        return null;
      });

      setupChain({ data: [mockMembershipPlanRow], error: null });

      const result = await getMembershipPlans(STORE_ID);

      // Should have fetched from Supabase since cache expired
      expect(mockFrom).toHaveBeenCalledWith('membership_plans');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('plan-1');
    });
  });

  // ─── getProductById ─────────────────────────────────────────────────────────

  describe('getProductById', () => {
    it('should return a single product by ID', async () => {
      setupChain({ data: mockProductRow, error: null });

      const result = await getProductById('prod-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('prod-1');
      expect(result!.name).toBe('Test Product');
      expect(mockFrom).toHaveBeenCalledWith('products');
    });

    it('should return null when product not found (PGRST116)', async () => {
      setupChain({ data: null, error: { code: 'PGRST116', message: 'No rows' } });

      const result = await getProductById('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw on non-PGRST116 error', async () => {
      setupChain({ data: null, error: { code: 'OTHER', message: 'DB error' } });

      await expect(getProductById('prod-1')).rejects.toThrow(
        'Failed to fetch product: DB error'
      );
    });
  });

  // ─── getMembershipPlanById ──────────────────────────────────────────────────

  describe('getMembershipPlanById', () => {
    it('should return a single membership plan by ID', async () => {
      setupChain({ data: mockMembershipPlanRow, error: null });

      const result = await getMembershipPlanById('plan-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('plan-1');
      expect(result!.displayName).toBe('Premium Plan');
      expect(mockFrom).toHaveBeenCalledWith('membership_plans');
    });

    it('should return null when plan not found (PGRST116)', async () => {
      setupChain({ data: null, error: { code: 'PGRST116', message: 'No rows' } });

      const result = await getMembershipPlanById('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw on non-PGRST116 error', async () => {
      setupChain({ data: null, error: { code: 'OTHER', message: 'DB error' } });

      await expect(getMembershipPlanById('plan-1')).rejects.toThrow(
        'Failed to fetch membership plan: DB error'
      );
    });
  });

  // ─── Bulk Delete ────────────────────────────────────────────────────────────

  describe('bulkDeleteProducts', () => {
    it('should soft-delete multiple products in a single call', async () => {
      setupChain({ data: null, error: null });

      await bulkDeleteProducts(['prod-1', 'prod-2', 'prod-3']);

      expect(mockFrom).toHaveBeenCalledWith('products');
    });

    it('should no-op on empty array', async () => {
      await bulkDeleteProducts([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      setupChain({ data: null, error: { message: 'Bulk delete failed' } });

      await expect(bulkDeleteProducts(['prod-1'])).rejects.toThrow(
        'Failed to bulk delete products: Bulk delete failed'
      );
    });

    it('should invalidate products cache', async () => {
      setupChain({ data: null, error: null });

      await bulkDeleteProducts(['prod-1']);

      expect(localStorage.removeItem).toHaveBeenCalledWith('catalog_products_v2');
    });
  });

  describe('bulkDeleteServices', () => {
    it('should soft-delete multiple services in a single call', async () => {
      setupChain({ data: null, error: null });

      await bulkDeleteServices(['svc-1', 'svc-2']);

      expect(mockFrom).toHaveBeenCalledWith('menu_services');
    });

    it('should no-op on empty array', async () => {
      await bulkDeleteServices([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      setupChain({ data: null, error: { message: 'Bulk delete failed' } });

      await expect(bulkDeleteServices(['svc-1'])).rejects.toThrow(
        'Failed to bulk delete services: Bulk delete failed'
      );
    });
  });

  describe('bulkDeleteMembershipPlans', () => {
    it('should soft-delete multiple membership plans in a single call', async () => {
      setupChain({ data: null, error: null });

      await bulkDeleteMembershipPlans(['plan-1', 'plan-2']);

      expect(mockFrom).toHaveBeenCalledWith('membership_plans');
    });

    it('should no-op on empty array', async () => {
      await bulkDeleteMembershipPlans([]);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      setupChain({ data: null, error: { message: 'Bulk delete failed' } });

      await expect(bulkDeleteMembershipPlans(['plan-1'])).rejects.toThrow(
        'Failed to bulk delete membership plans: Bulk delete failed'
      );
    });
  });
});
