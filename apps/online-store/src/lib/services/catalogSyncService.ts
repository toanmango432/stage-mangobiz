/**
 * Catalog Sync Service for Online Store
 * Fetches real catalog data from Supabase and caches locally
 * Replaces mock data generation with real sync
 */

import { createClient } from '@supabase/supabase-js';
import { Service } from '@/types/catalog';
import {
  toOnlineService as adapterToOnlineService,
  fromOnlineService,
  toOnlineCategory,
  toGiftCardConfig,
  fromGiftCardConfig,
  toOnlineMembershipPlan,
  fromOnlineMembershipPlan,
  type ServiceRow,
  type Category,
  type GiftCardSettingsRow,
  type GiftCardDenominationRow,
  type MembershipPlanRow,
} from '@/lib/adapters/catalogAdapters';
import type { GiftCardConfig, MembershipPlan } from '@/types/catalog';

// Environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');

  // Log warning but don't throw - allow app to work with mock data if no Supabase config
  console.warn(
    `Missing Supabase environment variables: ${missing.join(', ')}. ` +
    'Online Store will use mock data instead of real catalog sync.'
  );
}

// Create Supabase client (optional - may be undefined)
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false, // Online Store is public-facing
        persistSession: false,
      },
    })
  : null;

// Cache configuration
const CACHE_KEY_SERVICES = 'catalog_services_v2';
const CACHE_KEY_CATEGORIES = 'catalog_categories_v2';
const CACHE_KEY_GIFTCARD = 'catalog_giftcard_v2';
const CACHE_KEY_MEMBERSHIPS = 'catalog_memberships_v2';
const CACHE_KEY_ADDONS = 'catalog_addons_v2';
const CACHE_KEY_TIMESTAMP = 'catalog_sync_timestamp';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL_MS;
}

/**
 * Get data from localStorage cache
 */
function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    if (isCacheValid(parsed.timestamp)) {
      return parsed.data;
    }

    // Cache expired - clean up
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error(`[CatalogSync] Error reading cache for ${key}:`, error);
    return null;
  }
}

/**
 * Store data in localStorage cache
 */
function setCachedData<T>(key: string, data: T): void {
  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error(`[CatalogSync] Error writing cache for ${key}:`, error);
  }
}

/**
 * Convert Supabase menu_services row to Online Store Service type
 */
function toOnlineService(row: any): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category_id || 'Uncategorized', // TODO: Fetch category name
    description: row.description || '',
    duration: row.duration || 30,
    basePrice: row.base_price || 0,
    price: row.base_price || 0, // For booking flow compatibility
    showPriceOnline: row.show_price_online !== false, // Default to true if not set
    image: row.image_url || undefined,
    gallery: row.gallery_urls ? (Array.isArray(row.gallery_urls) ? row.gallery_urls : []) : undefined,
    addOns: [], // TODO: Load from add_on_groups/add_on_options
    questions: undefined, // TODO: Map from service settings if needed
    tags: Array.isArray(row.tags) ? row.tags : [],
    requiresDeposit: row.deposit_required || false,
    depositAmount: row.deposit_amount || undefined,
    bufferTimeBefore: row.buffer_before || 0,
    bufferTimeAfter: row.buffer_after || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    // Promotional fields
    imageUrl: row.image_url || undefined,
    featured: row.featured || false,
    badge: row.badge || undefined,
    rating: undefined, // TODO: Calculate from reviews
    reviewCount: undefined,
    bookingCount: undefined,
    benefits: undefined,
    compareAtPrice: undefined,
    tagline: row.tagline || undefined,
  };
}

/**
 * Validate RLS policy worked correctly (defense-in-depth)
 * Ensures all returned records match the requested storeId
 */
function validateStoreIsolation(data: any[], storeId: string, context: string): void {
  const invalidRecords = data.filter(row => row.store_id !== storeId);
  if (invalidRecords.length > 0) {
    console.error(`[SECURITY] RLS policy violation in ${context}`, {
      requestedStoreId: storeId,
      invalidRecordCount: invalidRecords.length,
      invalidStoreIds: [...new Set(invalidRecords.map(r => r.store_id))],
    });
    throw new Error(`Cross-store data leakage prevented in ${context}`);
  }
}

/**
 * Sync services from Supabase
 * Fetches only services with online_booking_enabled=true
 */
export async function syncFromSupabase(storeId: string): Promise<Service[]> {
  if (!supabase) {
    console.warn('[CatalogSync] Supabase client not configured - skipping sync');
    return [];
  }

  try {
    // Fetch services where online booking is enabled
    const { data, error } = await supabase
      .from('menu_services')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('online_booking_enabled', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[CatalogSync] Error fetching services:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[CatalogSync] No online-enabled services found for store:', storeId);
      return [];
    }

    // RLS Validation (defense-in-depth security)
    validateStoreIsolation(data, storeId, 'syncFromSupabase');

    // Convert to Online Store Service type
    const services = data.map(toOnlineService);

    // Cache the results
    setCachedData(CACHE_KEY_SERVICES, services);
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());

    console.log(`[CatalogSync] Synced ${services.length} services from Supabase`);
    return services;
  } catch (error) {
    console.error('[CatalogSync] Sync failed:', error);
    throw error;
  }
}

/**
 * Get services from cache or sync from Supabase if cache is stale
 */
export async function getServices(storeId: string): Promise<Service[]> {
  // Try cache first
  const cached = getCachedData<Service[]>(CACHE_KEY_SERVICES);
  if (cached) {
    console.log(`[CatalogSync] Using cached services (${cached.length} services)`);
    return cached;
  }

  // Cache miss or expired - sync from Supabase
  console.log('[CatalogSync] Cache miss - syncing from Supabase');
  return await syncFromSupabase(storeId);
}

/**
 * Get cached services without triggering sync
 * Returns empty array if cache is empty or stale
 */
export function getCachedServices(): Service[] {
  const cached = getCachedData<Service[]>(CACHE_KEY_SERVICES);
  return cached || [];
}

// ─── Categories ─────────────────────────────────────────────────────────────

/**
 * Fetch categories from Supabase service_categories table
 * Filters by is_deleted = false and is_active = true, ordered by display_order
 */
export async function getCategories(storeId: string): Promise<Category[]> {
  if (!supabase) {
    console.warn('[CatalogSync] Supabase client not configured - returning empty categories');
    return [];
  }

  // Try cache first
  const cached = getCachedData<Category[]>(CACHE_KEY_CATEGORIES);
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[CatalogSync] Error fetching categories:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // RLS Validation (defense-in-depth security)
    validateStoreIsolation(data, storeId, 'getCategories');

    const categories = data.map(toOnlineCategory);

    // Cache the results
    setCachedData(CACHE_KEY_CATEGORIES, categories);

    return categories;
  } catch (error) {
    console.error('[CatalogSync] getCategories failed:', error);
    throw error;
  }
}

/**
 * Get cached categories without triggering a fetch
 * Returns empty array if cache is empty or stale
 */
export function getCachedCategories(): Category[] {
  const cached = getCachedData<Category[]>(CACHE_KEY_CATEGORIES);
  return cached || [];
}

// ─── Service Write Operations ────────────────────────────────────────────────

/**
 * Invalidate the services cache so the next read fetches fresh data
 */
function invalidateServicesCache(): void {
  localStorage.removeItem(CACHE_KEY_SERVICES);
  localStorage.removeItem(CACHE_KEY_TIMESTAMP);
}

/**
 * Create a new service in Supabase
 * Supabase generates the UUID — do not pass an ID
 */
export async function createService(
  storeId: string,
  service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Service> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const row = fromOnlineService(service);
  row.store_id = storeId;

  const { data, error } = await supabase
    .from('menu_services')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create service: ${error.message}`);
  }

  invalidateServicesCache();
  return adapterToOnlineService(data as ServiceRow);
}

/**
 * Update an existing service in Supabase
 */
export async function updateService(
  id: string,
  updates: Partial<Service>
): Promise<Service> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const row = fromOnlineService(updates);
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('menu_services')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update service: ${error.message}`);
  }

  invalidateServicesCache();
  return adapterToOnlineService(data as ServiceRow);
}

/**
 * Soft-delete a service by setting is_deleted = true
 */
export async function deleteService(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('menu_services')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete service: ${error.message}`);
  }

  invalidateServicesCache();
}

// ─── Gift Card Operations ────────────────────────────────────────────────────

/**
 * Invalidate the gift card cache so the next read fetches fresh data
 */
function invalidateGiftCardCache(): void {
  localStorage.removeItem(CACHE_KEY_GIFTCARD);
}

/**
 * Fetch gift card configuration from Supabase
 * Combines gift_card_settings + gift_card_denominations into a single GiftCardConfig
 * Returns null if no settings row exists for the store
 */
export async function getGiftCardConfig(storeId: string): Promise<GiftCardConfig | null> {
  if (!supabase) {
    console.warn('[CatalogSync] Supabase client not configured - returning null gift card config');
    return null;
  }

  // Try cache first
  const cached = getCachedData<GiftCardConfig>(CACHE_KEY_GIFTCARD);
  if (cached) {
    return cached;
  }

  try {
    // Fetch settings (one row per store due to UNIQUE constraint)
    const { data: settingsData, error: settingsError } = await supabase
      .from('gift_card_settings')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .single();

    if (settingsError) {
      // PGRST116 = no rows found — not an error, just no config yet
      if (settingsError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch gift card settings: ${settingsError.message}`);
    }

    if (!settingsData) {
      return null;
    }

    // Validate store isolation
    if (settingsData.store_id !== storeId) {
      console.error('[SECURITY] RLS policy violation in getGiftCardConfig', {
        requestedStoreId: storeId,
        returnedStoreId: settingsData.store_id,
      });
      throw new Error('Cross-store data leakage prevented in getGiftCardConfig');
    }

    // Fetch denominations for this store
    const { data: denomData, error: denomError } = await supabase
      .from('gift_card_denominations')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (denomError) {
      throw new Error(`Failed to fetch gift card denominations: ${denomError.message}`);
    }

    // Validate denomination store isolation
    if (denomData && denomData.length > 0) {
      validateStoreIsolation(denomData, storeId, 'getGiftCardConfig:denominations');
    }

    const config = toGiftCardConfig(
      settingsData as GiftCardSettingsRow,
      (denomData || []) as GiftCardDenominationRow[]
    );

    // Cache the result
    setCachedData(CACHE_KEY_GIFTCARD, config);

    return config;
  } catch (error) {
    console.error('[CatalogSync] getGiftCardConfig failed:', error);
    throw error;
  }
}

/**
 * Update gift card configuration in Supabase
 * Upserts settings row and replaces active denomination rows
 */
export async function updateGiftCardConfig(
  storeId: string,
  config: Partial<GiftCardConfig>
): Promise<GiftCardConfig> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { settings, denominations } = fromGiftCardConfig(config);

  try {
    // Upsert settings (gift_card_settings has UNIQUE store_id constraint)
    settings.store_id = storeId;
    settings.updated_at = new Date().toISOString();

    const { data: settingsData, error: settingsError } = await supabase
      .from('gift_card_settings')
      .upsert(settings, { onConflict: 'store_id' })
      .select()
      .single();

    if (settingsError) {
      throw new Error(`Failed to update gift card settings: ${settingsError.message}`);
    }

    // Replace denomination rows:
    // 1. Soft-delete existing active denominations for this store
    const { error: deleteError } = await supabase
      .from('gift_card_denominations')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .eq('is_deleted', false);

    if (deleteError) {
      throw new Error(`Failed to clear existing denominations: ${deleteError.message}`);
    }

    // 2. Insert new denomination rows
    let denomData: GiftCardDenominationRow[] = [];
    if (denominations.length > 0) {
      const denomRows = denominations.map((d) => ({
        store_id: storeId,
        amount: d.amount,
        label: d.label,
        display_order: d.display_order,
        is_active: d.is_active,
        is_deleted: false,
      }));

      const { data: insertedDenoms, error: insertError } = await supabase
        .from('gift_card_denominations')
        .insert(denomRows)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert denominations: ${insertError.message}`);
      }

      denomData = (insertedDenoms || []) as GiftCardDenominationRow[];
    }

    invalidateGiftCardCache();

    return toGiftCardConfig(
      settingsData as GiftCardSettingsRow,
      denomData
    );
  } catch (error) {
    console.error('[CatalogSync] updateGiftCardConfig failed:', error);
    throw error;
  }
}

// ─── Membership Plan Operations ───────────────────────────────────────────────

/**
 * Invalidate the membership plans cache so the next read fetches fresh data
 */
function invalidateMembershipCache(): void {
  localStorage.removeItem(CACHE_KEY_MEMBERSHIPS);
}

/**
 * Fetch membership plans from Supabase
 * Filters by is_deleted = false, ordered by sort_order ASC
 */
export async function getMembershipPlans(storeId: string): Promise<MembershipPlan[]> {
  if (!supabase) {
    console.warn('[CatalogSync] Supabase client not configured - returning empty membership plans');
    return [];
  }

  // Try cache first
  const cached = getCachedData<MembershipPlan[]>(CACHE_KEY_MEMBERSHIPS);
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch membership plans: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // RLS Validation (defense-in-depth security)
    validateStoreIsolation(data, storeId, 'getMembershipPlans');

    const plans = data.map((row) => toOnlineMembershipPlan(row as MembershipPlanRow));

    // Cache the results
    setCachedData(CACHE_KEY_MEMBERSHIPS, plans);

    return plans;
  } catch (error) {
    console.error('[CatalogSync] getMembershipPlans failed:', error);
    throw error;
  }
}

/**
 * Get cached membership plans without triggering a fetch
 * Returns empty array if cache is empty or stale
 */
export function getCachedMembershipPlans(): MembershipPlan[] {
  const cached = getCachedData<MembershipPlan[]>(CACHE_KEY_MEMBERSHIPS);
  return cached || [];
}

/**
 * Create a new membership plan in Supabase
 * Supabase generates the UUID — do not pass an ID
 */
export async function createMembershipPlan(
  storeId: string,
  plan: Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MembershipPlan> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const row = fromOnlineMembershipPlan(plan);
  row.store_id = storeId;

  const { data, error } = await supabase
    .from('membership_plans')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create membership plan: ${error.message}`);
  }

  invalidateMembershipCache();
  return toOnlineMembershipPlan(data as MembershipPlanRow);
}

/**
 * Update an existing membership plan in Supabase
 */
export async function updateMembershipPlan(
  id: string,
  updates: Partial<MembershipPlan>
): Promise<MembershipPlan> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const row = fromOnlineMembershipPlan(updates);
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('membership_plans')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update membership plan: ${error.message}`);
  }

  invalidateMembershipCache();
  return toOnlineMembershipPlan(data as MembershipPlanRow);
}

/**
 * Soft-delete a membership plan by setting is_deleted = true
 */
export async function deleteMembershipPlan(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('membership_plans')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete membership plan: ${error.message}`);
  }

  invalidateMembershipCache();
}

/**
 * Add-on group structure for Online Store
 */
export interface AddOnGroup {
  id: string;
  name: string;
  description?: string;
  selectionMode: 'single' | 'multiple';
  minSelections: number;
  maxSelections?: number;
  isRequired: boolean;
  displayOrder: number;
  options: AddOnOption[];
}

export interface AddOnOption {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  displayOrder: number;
}

/**
 * Get add-on groups for a service
 * Filters by applicability (service ID or category ID)
 */
export async function getAddOnGroups(storeId: string, serviceId: string, categoryId?: string): Promise<AddOnGroup[]> {
  if (!supabase) {
    console.log('[CatalogSync] Supabase not available - returning empty add-on groups');
    return [];
  }

  try {
    // Fetch all active add-on groups for the store
    const { data: groupsData, error: groupsError } = await supabase
      .from('add_on_groups')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('online_booking_enabled', true)
      .order('display_order', { ascending: true });

    if (groupsError) {
      console.error('[CatalogSync] Error fetching add-on groups:', groupsError);
      throw groupsError;
    }

    if (!groupsData || groupsData.length === 0) {
      console.log('[CatalogSync] No add-on groups found for store:', storeId);
      return [];
    }

    // RLS Validation (defense-in-depth security)
    validateStoreIsolation(groupsData, storeId, 'getAddOnGroups');

    // Filter groups by applicability
    const applicableGroups = groupsData.filter((group) => {
      if (group.applicable_to_all) return true;
      if (serviceId && group.applicable_service_ids?.includes(serviceId)) return true;
      if (categoryId && group.applicable_category_ids?.includes(categoryId)) return true;
      return false;
    });

    if (applicableGroups.length === 0) {
      console.log('[CatalogSync] No applicable add-on groups for service:', serviceId);
      return [];
    }

    // Fetch options for all applicable groups
    const groupIds = applicableGroups.map(g => g.id);
    const { data: optionsData, error: optionsError } = await supabase
      .from('add_on_options')
      .select('*')
      .in('group_id', groupIds)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (optionsError) {
      console.error('[CatalogSync] Error fetching add-on options:', optionsError);
      throw optionsError;
    }

    // Note: add_on_options doesn't have store_id column, validated via parent group

    // Build groups with their options
    const groups: AddOnGroup[] = applicableGroups.map((group) => {
      const groupOptions = (optionsData || [])
        .filter(opt => opt.group_id === group.id)
        .map(opt => ({
          id: opt.id,
          groupId: opt.group_id,
          name: opt.name,
          description: opt.description,
          price: opt.price,
          duration: opt.duration,
          displayOrder: opt.display_order,
        }));

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        selectionMode: group.selection_mode as 'single' | 'multiple',
        minSelections: group.min_selections,
        maxSelections: group.max_selections,
        isRequired: group.is_required,
        displayOrder: group.display_order,
        options: groupOptions,
      };
    });

    console.log(`[CatalogSync] Loaded ${groups.length} add-on groups for service ${serviceId}`);
    return groups;
  } catch (error) {
    console.error('[CatalogSync] getAddOnGroups failed:', error);
    throw error;
  }
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY_SERVICES);
  localStorage.removeItem(CACHE_KEY_CATEGORIES);
  localStorage.removeItem(CACHE_KEY_GIFTCARD);
  localStorage.removeItem(CACHE_KEY_MEMBERSHIPS);
  localStorage.removeItem(CACHE_KEY_ADDONS);
  localStorage.removeItem(CACHE_KEY_TIMESTAMP);
  console.log('[CatalogSync] Cache cleared');
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(): {
  hasServices: boolean;
  serviceCount: number;
  lastSyncAt: Date | null;
  isValid: boolean;
} {
  const services = getCachedData<Service[]>(CACHE_KEY_SERVICES);
  const timestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);
  const lastSyncAt = timestamp ? new Date(parseInt(timestamp)) : null;

  return {
    hasServices: !!services,
    serviceCount: services?.length || 0,
    lastSyncAt,
    isValid: services !== null,
  };
}
