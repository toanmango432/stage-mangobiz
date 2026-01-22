/**
 * Catalog Sync Service for Online Store
 * Fetches real catalog data from Supabase and caches locally
 * Replaces mock data generation with real sync
 */

import { createClient } from '@supabase/supabase-js';
import { Service } from '@/types/catalog';

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
