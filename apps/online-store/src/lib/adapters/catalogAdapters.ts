/**
 * Catalog Adapters for Online Store
 * Converts between Supabase row types (snake_case) and Online Store types (camelCase)
 */

import type { Service } from '@/types/catalog';

// ─── Supabase Row Interfaces ─────────────────────────────────────────────────

/**
 * Matches menu_services table from migration 031
 */
export interface ServiceRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  category_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  pricing_type: 'fixed' | 'from' | 'free' | 'varies' | 'hourly';
  price: number;
  price_max: number | null;
  cost: number | null;
  taxable: boolean;
  duration: number;
  extra_time: number | null;
  extra_time_type: 'processing' | 'blocked' | 'finishing' | null;
  aftercare_instructions: string | null;
  requires_patch_test: boolean;
  has_variants: boolean;
  variant_count: number;
  all_staff_can_perform: boolean;
  booking_availability: 'online' | 'in-store' | 'both' | 'disabled';
  online_booking_enabled: boolean;
  requires_deposit: boolean;
  deposit_amount: number | null;
  deposit_percentage: number | null;
  online_booking_buffer_minutes: number | null;
  advance_booking_days_min: number | null;
  advance_booking_days_max: number | null;
  rebook_reminder_days: number | null;
  turn_weight: number | null;
  commission_rate: number | null;
  color: string | null;
  images: string[] | null;
  tags: string[] | null;
  status: 'active' | 'inactive' | 'archived';
  display_order: number;
  show_price_online: boolean;
  allow_custom_duration: boolean;
  archived_at: string | null;
  archived_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Matches service_categories table from migration 031
 */
export interface CategoryRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  parent_category_id: string | null;
  show_online_booking: boolean | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Category Type ───────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  displayOrder: number;
}

// ─── Adapters: Service ───────────────────────────────────────────────────────

/**
 * Convert a Supabase menu_services row to an Online Store Service
 */
export function toOnlineService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category_id || 'Uncategorized',
    description: row.description || '',
    duration: row.duration || 30,
    basePrice: row.price || 0,
    price: row.price || 0,
    showOnline: row.online_booking_enabled,
    showPriceOnline: row.show_price_online,
    image: Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : undefined,
    gallery: Array.isArray(row.images) ? row.images : undefined,
    hasVariants: row.has_variants,
    variants: undefined,
    addOns: [],
    questions: undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    requiresDeposit: row.requires_deposit,
    depositAmount: row.deposit_amount ?? undefined,
    bufferTimeBefore: row.online_booking_buffer_minutes ?? 0,
    bufferTimeAfter: 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    imageUrl: Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : undefined,
    featured: false,
    badge: undefined,
    rating: undefined,
    reviewCount: undefined,
    bookingCount: undefined,
    benefits: undefined,
    compareAtPrice: undefined,
    tagline: undefined,
  };
}

/**
 * Convert an Online Store Service to a partial Supabase menu_services row for writes
 */
export function fromOnlineService(
  service: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>
): Partial<ServiceRow> {
  const row: Partial<ServiceRow> = {};

  if (service.name !== undefined) row.name = service.name;
  if (service.category !== undefined) row.category_id = service.category;
  if (service.description !== undefined) row.description = service.description || null;
  if (service.duration !== undefined) row.duration = service.duration;
  if (service.basePrice !== undefined) row.price = service.basePrice;
  if (service.showOnline !== undefined) row.online_booking_enabled = service.showOnline;
  if (service.showPriceOnline !== undefined) row.show_price_online = service.showPriceOnline;
  if (service.hasVariants !== undefined) row.has_variants = service.hasVariants;
  if (service.tags !== undefined) row.tags = service.tags;
  if (service.requiresDeposit !== undefined) row.requires_deposit = service.requiresDeposit;
  if (service.depositAmount !== undefined) row.deposit_amount = service.depositAmount ?? null;
  if (service.bufferTimeBefore !== undefined) {
    row.online_booking_buffer_minutes = service.bufferTimeBefore;
  }
  if (service.gallery !== undefined) row.images = service.gallery ?? null;

  return row;
}

// ─── Adapters: Category ──────────────────────────────────────────────────────

/**
 * Convert a Supabase service_categories row to an Online Store Category
 */
export function toOnlineCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color || '#6366F1',
    icon: row.icon ?? undefined,
    displayOrder: row.display_order,
  };
}
