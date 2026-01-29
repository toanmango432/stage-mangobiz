/**
 * Catalog Adapters for Online Store
 * Converts between Supabase row types (snake_case) and Online Store types (camelCase)
 */

import type { Service, Product, GiftCardConfig, MembershipPlan, MembershipFeatures, MembershipRules } from '@/types/catalog';

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
    duration: row.duration ?? 30,
    basePrice: Number(row.price ?? 0),
    price: Number(row.price ?? 0),
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
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : undefined,
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

// ─── Supabase Row Interfaces: Products ──────────────────────────────────────

/**
 * Matches products table from migration 017 (e-commerce catalog)
 */
export interface ProductRow {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  sku: string | null;
  barcode: string | null;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  allow_backorder: boolean;
  images: Array<{ url: string; alt?: string; position?: number }> | null;
  thumbnail_url: string | null;
  weight: number | null;
  weight_unit: string | null;
  dimensions: { length: number; width: number; height: number; unit?: string } | null;
  has_variants: boolean;
  variant_options: Array<Record<string, unknown>> | null;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  is_featured: boolean;
  show_online: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Adapters: Product ──────────────────────────────────────────────────────

/**
 * Convert a Supabase products row (migration 017) to an Online Store Product
 */
export function toOnlineProduct(row: ProductRow): Product {
  const images = Array.isArray(row.images)
    ? row.images.map((img) => (typeof img === 'string' ? img : img.url))
    : [];

  return {
    id: row.id,
    name: row.name,
    sku: row.sku || '',
    category: row.category_id || '',
    description: row.description || '',
    costPrice: Number(row.cost_price) || 0,
    retailPrice: Number(row.price) || 0,
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
    taxable: false, // Not in migration 017 — default
    trackInventory: row.track_inventory,
    stockQuantity: row.stock_quantity ?? 0,
    lowStockThreshold: row.low_stock_threshold ?? 5,
    allowBackorders: row.allow_backorder,
    images,
    requiresShipping: false, // Not in migration 017 — default
    weight: row.weight != null ? Number(row.weight) : undefined,
    dimensions: row.dimensions ?? undefined,
    collections: [],  // Not in migration 017 — default
    tags: [],  // Not in migration 017 — default
    showOnline: row.show_online,
    featured: row.is_featured,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Convert an Online Store Product to a partial Supabase products row for writes
 */
export function fromOnlineProduct(
  product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Partial<ProductRow> {
  const row: Partial<ProductRow> = {};

  if (product.name !== undefined) row.name = product.name;
  if (product.sku !== undefined) row.sku = product.sku || null;
  if (product.category !== undefined) row.category_id = product.category || null;
  if (product.description !== undefined) row.description = product.description || null;
  if (product.retailPrice !== undefined) row.price = product.retailPrice;
  if (product.compareAtPrice !== undefined) {
    row.compare_at_price = product.compareAtPrice ?? null;
  }
  if (product.costPrice !== undefined) row.cost_price = product.costPrice;
  if (product.trackInventory !== undefined) row.track_inventory = product.trackInventory;
  if (product.stockQuantity !== undefined) row.stock_quantity = product.stockQuantity;
  if (product.lowStockThreshold !== undefined) row.low_stock_threshold = product.lowStockThreshold;
  if (product.allowBackorders !== undefined) row.allow_backorder = product.allowBackorders;
  if (product.images !== undefined) {
    row.images = product.images.map((url, i) => ({ url, position: i }));
  }
  if (product.weight !== undefined) row.weight = product.weight ?? null;
  if (product.dimensions !== undefined) row.dimensions = product.dimensions ?? null;
  if (product.showOnline !== undefined) row.show_online = product.showOnline;
  if (product.featured !== undefined) row.is_featured = product.featured;

  return row;
}

// ─── Supabase Row Interfaces: Gift Cards ────────────────────────────────────

/**
 * Matches gift_card_settings table from migration 031
 * One row per store (UNIQUE store_id constraint)
 */
export interface GiftCardSettingsRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  allow_custom_amount: boolean;
  min_amount: number;
  max_amount: number;
  default_expiration_days: number | null;
  online_enabled: boolean;
  email_delivery_enabled: boolean;
  sync_status: 'local' | 'pending' | 'synced' | 'conflict' | 'error';
  version: number;
  vector_clock: Record<string, unknown>;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  created_by_device: string | null;
  last_modified_by: string | null;
  last_modified_by_device: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

/**
 * Matches gift_card_denominations table from migration 031
 * Multiple rows per store (one per preset amount)
 */
export interface GiftCardDenominationRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  amount: number;
  label: string | null;
  is_active: boolean;
  display_order: number;
  sync_status: 'local' | 'pending' | 'synced' | 'conflict' | 'error';
  version: number;
  vector_clock: Record<string, unknown>;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  created_by_device: string | null;
  last_modified_by: string | null;
  last_modified_by_device: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

// ─── Adapters: Gift Cards ───────────────────────────────────────────────────

/**
 * Combine a gift_card_settings row and gift_card_denominations rows
 * into a GiftCardConfig for the Online Store UI.
 *
 * Fields not stored in Supabase (designs, emailTemplate, terms) get defaults.
 */
export function toGiftCardConfig(
  settingsRow: GiftCardSettingsRow,
  denominationRows: GiftCardDenominationRow[]
): GiftCardConfig {
  const presetAmounts = denominationRows
    .filter((d) => d.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .map((d) => Number(d.amount));

  const expiryDays = settingsRow.default_expiration_days;
  const expiryMonths = expiryDays != null ? Math.round(expiryDays / 30) : null;

  return {
    enabled: settingsRow.online_enabled,
    presetAmounts,
    allowCustomAmounts: settingsRow.allow_custom_amount,
    customAmountMin: Number(settingsRow.min_amount),
    customAmountMax: Number(settingsRow.max_amount),
    expiryMonths,
    designs: [],
    deliveryOptions: {
      digital: settingsRow.email_delivery_enabled,
      physical: true,
      messageCharLimit: 200,
    },
    terms: '',
    emailTemplate: {
      subject: 'You received a gift card!',
      body: '',
    },
  };
}

/**
 * Convert a GiftCardConfig back to partial Supabase rows for writes.
 * Returns settings fields and denomination data separately.
 */
export function fromGiftCardConfig(config: Partial<GiftCardConfig>): {
  settings: Partial<GiftCardSettingsRow>;
  denominations: Array<{ amount: number; label: string | null; display_order: number; is_active: boolean }>;
} {
  const settings: Partial<GiftCardSettingsRow> = {};

  if (config.enabled !== undefined) settings.online_enabled = config.enabled;
  if (config.allowCustomAmounts !== undefined) settings.allow_custom_amount = config.allowCustomAmounts;
  if (config.customAmountMin !== undefined) settings.min_amount = config.customAmountMin;
  if (config.customAmountMax !== undefined) settings.max_amount = config.customAmountMax;
  if (config.expiryMonths !== undefined) {
    settings.default_expiration_days = config.expiryMonths != null ? config.expiryMonths * 30 : null;
  }
  if (config.deliveryOptions?.digital !== undefined) {
    settings.email_delivery_enabled = config.deliveryOptions.digital;
  }

  const denominations = (config.presetAmounts ?? []).map((amount, index) => ({
    amount,
    label: `$${amount}`,
    display_order: index,
    is_active: true,
  }));

  return { settings, denominations };
}

// ─── Supabase Row Interfaces: Membership Plans ─────────────────────────────

/**
 * Matches membership_plans table from migration 033
 */
export interface MembershipPlanRow {
  id: string;
  tenant_id: string;
  store_id: string;
  location_id: string | null;
  name: string;
  display_name: string;
  price_monthly: number;
  description: string | null;
  tagline: string | null;
  image_url: string | null;
  badge_icon: string | null;
  color: string | null;
  perks: string[];
  features: MembershipFeatures;
  rules: MembershipRules;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  sync_status: 'local' | 'pending' | 'synced' | 'conflict' | 'error';
  version: number;
  vector_clock: Record<string, unknown>;
  last_synced_version: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  created_by_device: string | null;
  last_modified_by: string | null;
  last_modified_by_device: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_by_device: string | null;
  tombstone_expires_at: string | null;
}

// ─── Adapters: Membership Plans ─────────────────────────────────────────────

/**
 * Convert a Supabase membership_plans row to an Online Store MembershipPlan
 */
export function toOnlineMembershipPlan(row: MembershipPlanRow): MembershipPlan {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    priceMonthly: Number(row.price_monthly),
    description: row.description || '',
    tagline: row.tagline || '',
    imageUrl: row.image_url || '',
    badgeIcon: row.badge_icon || '',
    color: row.color || '',
    perks: Array.isArray(row.perks) ? row.perks : [],
    features: row.features || {},
    rules: row.rules || {},
    isPopular: row.is_popular,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Convert an Online Store MembershipPlan to a partial Supabase membership_plans row for writes
 */
export function fromOnlineMembershipPlan(
  plan: Partial<Omit<MembershipPlan, 'id' | 'createdAt' | 'updatedAt'>>
): Partial<MembershipPlanRow> {
  const row: Partial<MembershipPlanRow> = {};

  if (plan.name !== undefined) row.name = plan.name;
  if (plan.displayName !== undefined) row.display_name = plan.displayName;
  if (plan.priceMonthly !== undefined) row.price_monthly = plan.priceMonthly;
  if (plan.description !== undefined) row.description = plan.description || null;
  if (plan.tagline !== undefined) row.tagline = plan.tagline || null;
  if (plan.imageUrl !== undefined) row.image_url = plan.imageUrl || null;
  if (plan.badgeIcon !== undefined) row.badge_icon = plan.badgeIcon || null;
  if (plan.color !== undefined) row.color = plan.color || null;
  if (plan.perks !== undefined) row.perks = plan.perks;
  if (plan.features !== undefined) row.features = plan.features;
  if (plan.rules !== undefined) row.rules = plan.rules;
  if (plan.isPopular !== undefined) row.is_popular = plan.isPopular;
  if (plan.isActive !== undefined) row.is_active = plan.isActive;
  if (plan.sortOrder !== undefined) row.sort_order = plan.sortOrder;

  return row;
}
