import { describe, it, expect } from 'vitest';
import {
  toOnlineService,
  fromOnlineService,
  toOnlineCategory,
  toOnlineProduct,
  fromOnlineProduct,
  toGiftCardConfig,
  fromGiftCardConfig,
  toOnlineMembershipPlan,
  fromOnlineMembershipPlan,
} from '../catalogAdapters';
import type {
  ServiceRow,
  CategoryRow,
  ProductRow,
  GiftCardSettingsRow,
  GiftCardDenominationRow,
  MembershipPlanRow,
} from '../catalogAdapters';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const serviceRowFixture: ServiceRow = {
  id: 'svc-001',
  tenant_id: 'tenant-1',
  store_id: 'store-1',
  location_id: null,
  category_id: 'cat-001',
  name: 'Gel Manicure',
  description: 'A premium gel manicure service',
  sku: 'GEL-MAN-001',
  pricing_type: 'fixed',
  price: 45,
  price_max: null,
  cost: 15,
  taxable: true,
  duration: 60,
  extra_time: 10,
  extra_time_type: 'processing',
  aftercare_instructions: 'Avoid water for 2 hours',
  requires_patch_test: false,
  has_variants: false,
  variant_count: 0,
  all_staff_can_perform: true,
  booking_availability: 'both',
  online_booking_enabled: true,
  requires_deposit: true,
  deposit_amount: 20,
  deposit_percentage: null,
  online_booking_buffer_minutes: 15,
  advance_booking_days_min: 1,
  advance_booking_days_max: 30,
  rebook_reminder_days: 14,
  turn_weight: 1,
  commission_rate: 0.5,
  color: '#FF5733',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  tags: ['gel', 'manicure', 'popular'],
  status: 'active',
  display_order: 1,
  show_price_online: true,
  allow_custom_duration: false,
  archived_at: null,
  archived_by: null,
  is_deleted: false,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-15T12:00:00.000Z',
};

const categoryRowFixture: CategoryRow = {
  id: 'cat-001',
  tenant_id: 'tenant-1',
  store_id: 'store-1',
  location_id: null,
  name: 'Nail Services',
  description: 'All nail-related services',
  color: '#E91E63',
  icon: 'nail-polish',
  display_order: 2,
  is_active: true,
  parent_category_id: null,
  show_online_booking: true,
  is_deleted: false,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-10T00:00:00.000Z',
};

const productRowFixture: ProductRow = {
  id: 'prod-001',
  store_id: 'store-1',
  category_id: 'pcat-001',
  name: 'Moisturizing Lotion',
  slug: 'moisturizing-lotion',
  description: 'A rich moisturizing body lotion',
  short_description: 'Rich body lotion',
  price: 24.99,
  compare_at_price: 34.99,
  cost_price: 8.5,
  sku: 'LOT-MOIST-001',
  barcode: '1234567890123',
  track_inventory: true,
  stock_quantity: 150,
  low_stock_threshold: 10,
  allow_backorder: false,
  images: [
    { url: 'https://example.com/lotion1.jpg', alt: 'Front view', position: 0 },
    { url: 'https://example.com/lotion2.jpg', alt: 'Side view', position: 1 },
  ],
  thumbnail_url: 'https://example.com/lotion-thumb.jpg',
  weight: 0.5,
  weight_unit: 'kg',
  dimensions: { length: 10, width: 5, height: 20, unit: 'cm' },
  has_variants: false,
  variant_options: null,
  meta_title: 'Moisturizing Lotion - Best Seller',
  meta_description: 'Our top-selling body lotion',
  is_active: true,
  is_featured: true,
  show_online: true,
  created_at: '2026-01-05T00:00:00.000Z',
  updated_at: '2026-01-20T10:00:00.000Z',
};

const giftCardSettingsFixture: GiftCardSettingsRow = {
  id: 'gc-settings-001',
  tenant_id: 'tenant-1',
  store_id: 'store-1',
  location_id: null,
  allow_custom_amount: true,
  min_amount: 10,
  max_amount: 500,
  default_expiration_days: 365,
  online_enabled: true,
  email_delivery_enabled: true,
  sync_status: 'synced',
  version: 1,
  vector_clock: {},
  last_synced_version: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-10T00:00:00.000Z',
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

const giftCardDenominationsFixture: GiftCardDenominationRow[] = [
  {
    id: 'denom-001',
    tenant_id: 'tenant-1',
    store_id: 'store-1',
    location_id: null,
    amount: 25,
    label: '$25',
    is_active: true,
    display_order: 0,
    sync_status: 'synced',
    version: 1,
    vector_clock: {},
    last_synced_version: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
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
    id: 'denom-002',
    tenant_id: 'tenant-1',
    store_id: 'store-1',
    location_id: null,
    amount: 50,
    label: '$50',
    is_active: true,
    display_order: 1,
    sync_status: 'synced',
    version: 1,
    vector_clock: {},
    last_synced_version: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
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
    id: 'denom-003',
    tenant_id: 'tenant-1',
    store_id: 'store-1',
    location_id: null,
    amount: 100,
    label: '$100',
    is_active: false, // inactive — should be filtered out
    display_order: 2,
    sync_status: 'synced',
    version: 1,
    vector_clock: {},
    last_synced_version: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
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

const membershipPlanRowFixture: MembershipPlanRow = {
  id: 'mem-001',
  tenant_id: 'tenant-1',
  store_id: 'store-1',
  location_id: null,
  name: 'premium',
  display_name: 'Premium Plan',
  price_monthly: 99.99,
  description: 'Our premium membership with exclusive perks',
  tagline: 'The best value for regulars',
  image_url: 'https://example.com/premium.jpg',
  badge_icon: 'crown',
  color: '#FFD700',
  perks: ['20% off all services', 'Priority booking', 'Free samples'],
  features: { discountPercentage: 20, priorityBooking: true, freeProductSamples: true },
  rules: { minCommitmentMonths: 3, cancellationNoticeDays: 30 },
  is_popular: true,
  is_active: true,
  sort_order: 1,
  sync_status: 'synced',
  version: 1,
  vector_clock: {},
  last_synced_version: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
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

// ─── Tests: toOnlineService ─────────────────────────────────────────────────

describe('toOnlineService', () => {
  it('converts a full ServiceRow to a Service', () => {
    const result = toOnlineService(serviceRowFixture);

    expect(result.id).toBe('svc-001');
    expect(result.name).toBe('Gel Manicure');
    expect(result.category).toBe('cat-001');
    expect(result.description).toBe('A premium gel manicure service');
    expect(result.duration).toBe(60);
    expect(result.basePrice).toBe(45);
    expect(result.price).toBe(45);
    expect(result.showOnline).toBe(true);
    expect(result.showPriceOnline).toBe(true);
    expect(result.image).toBe('https://example.com/img1.jpg');
    expect(result.gallery).toEqual(['https://example.com/img1.jpg', 'https://example.com/img2.jpg']);
    expect(result.hasVariants).toBe(false);
    expect(result.tags).toEqual(['gel', 'manicure', 'popular']);
    expect(result.requiresDeposit).toBe(true);
    expect(result.depositAmount).toBe(20);
    expect(result.bufferTimeBefore).toBe(15);
    expect(result.bufferTimeAfter).toBe(0);
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.updatedAt).toBe('2026-01-15T12:00:00.000Z');
  });

  it('handles null/undefined fields gracefully', () => {
    const minimalRow: ServiceRow = {
      ...serviceRowFixture,
      description: null,
      images: null,
      tags: null,
      deposit_amount: null,
      online_booking_buffer_minutes: null,
    };

    const result = toOnlineService(minimalRow);

    expect(result.description).toBe('');
    expect(result.image).toBeUndefined();
    expect(result.gallery).toBeUndefined();
    expect(result.tags).toEqual([]);
    expect(result.depositAmount).toBeUndefined();
    expect(result.bufferTimeBefore).toBe(0);
  });

  it('handles empty images array', () => {
    const row: ServiceRow = { ...serviceRowFixture, images: [] };
    const result = toOnlineService(row);

    expect(result.image).toBeUndefined();
    expect(result.gallery).toEqual([]);
  });

  it('uses category_id as category field', () => {
    const row: ServiceRow = { ...serviceRowFixture, category_id: '' };
    const result = toOnlineService(row);

    expect(result.category).toBe('Uncategorized');
  });

  it('preserves duration of 0 without defaulting to 30', () => {
    const row: ServiceRow = { ...serviceRowFixture, duration: 0 };
    const result = toOnlineService(row);

    expect(result.duration).toBe(0);
  });

  it('preserves price of 0 (free service)', () => {
    const row: ServiceRow = { ...serviceRowFixture, price: 0 };
    const result = toOnlineService(row);

    expect(result.basePrice).toBe(0);
    expect(result.price).toBe(0);
  });

  it('coerces string price from Supabase DECIMAL column', () => {
    const row: ServiceRow = {
      ...serviceRowFixture,
      price: '49.99' as unknown as number, // Supabase DECIMAL returns strings
    };
    const result = toOnlineService(row);

    expect(result.basePrice).toBe(49.99);
    expect(typeof result.basePrice).toBe('number');
    expect(result.price).toBe(49.99);
    expect(typeof result.price).toBe('number');
  });

  it('coerces string deposit_amount from Supabase DECIMAL column', () => {
    const row: ServiceRow = {
      ...serviceRowFixture,
      deposit_amount: '25.50' as unknown as number,
    };
    const result = toOnlineService(row);

    expect(result.depositAmount).toBe(25.5);
    expect(typeof result.depositAmount).toBe('number');
  });
});

// ─── Tests: fromOnlineService ───────────────────────────────────────────────

describe('fromOnlineService', () => {
  it('converts service fields to snake_case row', () => {
    const result = fromOnlineService({
      name: 'New Service',
      category: 'cat-002',
      description: 'Description here',
      duration: 45,
      basePrice: 55,
      showOnline: false,
      showPriceOnline: true,
      hasVariants: true,
      tags: ['tag1', 'tag2'],
      requiresDeposit: false,
    });

    expect(result.name).toBe('New Service');
    expect(result.category_id).toBe('cat-002');
    expect(result.description).toBe('Description here');
    expect(result.duration).toBe(45);
    expect(result.price).toBe(55);
    expect(result.online_booking_enabled).toBe(false);
    expect(result.show_price_online).toBe(true);
    expect(result.has_variants).toBe(true);
    expect(result.tags).toEqual(['tag1', 'tag2']);
    expect(result.requires_deposit).toBe(false);
  });

  it('only includes defined fields (partial update)', () => {
    const result = fromOnlineService({ name: 'Only Name' });

    expect(result.name).toBe('Only Name');
    expect(result.category_id).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.duration).toBeUndefined();
    expect(result.price).toBeUndefined();
  });

  it('converts empty description to null', () => {
    const result = fromOnlineService({ description: '' });
    expect(result.description).toBeNull();
  });

  it('maps gallery to images', () => {
    const result = fromOnlineService({
      gallery: ['url1.jpg', 'url2.jpg'],
    });
    expect(result.images).toEqual(['url1.jpg', 'url2.jpg']);
  });

  it('does not set deposit_amount when depositAmount is undefined', () => {
    const result = fromOnlineService({ depositAmount: undefined });
    expect(result.deposit_amount).toBeUndefined();
  });

  it('round-trips key fields correctly', () => {
    const original = toOnlineService(serviceRowFixture);
    const row = fromOnlineService(original);

    expect(row.name).toBe(serviceRowFixture.name);
    expect(row.category_id).toBe(serviceRowFixture.category_id);
    expect(row.duration).toBe(serviceRowFixture.duration);
    expect(row.price).toBe(serviceRowFixture.price);
    expect(row.online_booking_enabled).toBe(serviceRowFixture.online_booking_enabled);
    expect(row.show_price_online).toBe(serviceRowFixture.show_price_online);
    expect(row.has_variants).toBe(serviceRowFixture.has_variants);
    expect(row.tags).toEqual(serviceRowFixture.tags);
    expect(row.requires_deposit).toBe(serviceRowFixture.requires_deposit);
    expect(row.deposit_amount).toBe(serviceRowFixture.deposit_amount);
    expect(row.online_booking_buffer_minutes).toBe(serviceRowFixture.online_booking_buffer_minutes);
    expect(row.images).toEqual(serviceRowFixture.images);
  });
});

// ─── Tests: toOnlineCategory ────────────────────────────────────────────────

describe('toOnlineCategory', () => {
  it('converts a full CategoryRow to a Category', () => {
    const result = toOnlineCategory(categoryRowFixture);

    expect(result.id).toBe('cat-001');
    expect(result.name).toBe('Nail Services');
    expect(result.color).toBe('#E91E63');
    expect(result.icon).toBe('nail-polish');
    expect(result.displayOrder).toBe(2);
  });

  it('uses default color when color is empty', () => {
    const row: CategoryRow = { ...categoryRowFixture, color: '' };
    const result = toOnlineCategory(row);

    expect(result.color).toBe('#6366F1');
  });

  it('converts null icon to undefined', () => {
    const row: CategoryRow = { ...categoryRowFixture, icon: null };
    const result = toOnlineCategory(row);

    expect(result.icon).toBeUndefined();
  });
});

// ─── Tests: toOnlineProduct ─────────────────────────────────────────────────

describe('toOnlineProduct', () => {
  it('converts a full ProductRow to a Product', () => {
    const result = toOnlineProduct(productRowFixture);

    expect(result.id).toBe('prod-001');
    expect(result.name).toBe('Moisturizing Lotion');
    expect(result.sku).toBe('LOT-MOIST-001');
    expect(result.category).toBe('pcat-001');
    expect(result.description).toBe('A rich moisturizing body lotion');
    expect(result.costPrice).toBe(8.5);
    expect(result.retailPrice).toBe(24.99);
    expect(result.compareAtPrice).toBe(34.99);
    expect(result.trackInventory).toBe(true);
    expect(result.stockQuantity).toBe(150);
    expect(result.lowStockThreshold).toBe(10);
    expect(result.allowBackorders).toBe(false);
    expect(result.images).toEqual([
      'https://example.com/lotion1.jpg',
      'https://example.com/lotion2.jpg',
    ]);
    expect(result.showOnline).toBe(true);
    expect(result.featured).toBe(true);
    expect(result.weight).toBe(0.5);
    expect(result.dimensions).toEqual({ length: 10, width: 5, height: 20, unit: 'cm' });
    expect(result.createdAt).toBe('2026-01-05T00:00:00.000Z');
    expect(result.updatedAt).toBe('2026-01-20T10:00:00.000Z');
  });

  it('handles null/undefined fields gracefully', () => {
    const minimalRow: ProductRow = {
      ...productRowFixture,
      category_id: null,
      description: null,
      sku: null,
      cost_price: null,
      compare_at_price: null,
      images: null,
      weight: null,
      dimensions: null,
    };

    const result = toOnlineProduct(minimalRow);

    expect(result.category).toBe('');
    expect(result.description).toBe('');
    expect(result.sku).toBe('');
    expect(result.costPrice).toBe(0);
    expect(result.compareAtPrice).toBeUndefined();
    expect(result.images).toEqual([]);
    expect(result.weight).toBeUndefined();
    expect(result.dimensions).toBeUndefined();
  });

  it('provides defaults for fields not in migration 017', () => {
    const result = toOnlineProduct(productRowFixture);

    expect(result.taxable).toBe(false);
    expect(result.requiresShipping).toBe(false);
    expect(result.collections).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  it('preserves stock_quantity of 0 without defaulting', () => {
    const row: ProductRow = { ...productRowFixture, stock_quantity: 0 };
    const result = toOnlineProduct(row);

    expect(result.stockQuantity).toBe(0);
  });

  it('preserves low_stock_threshold of 0 without defaulting to 5', () => {
    const row: ProductRow = { ...productRowFixture, low_stock_threshold: 0 };
    const result = toOnlineProduct(row);

    expect(result.lowStockThreshold).toBe(0);
  });

  it('handles string images (plain URL strings instead of objects)', () => {
    const row: ProductRow = {
      ...productRowFixture,
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'] as unknown as ProductRow['images'],
    };
    const result = toOnlineProduct(row);

    expect(result.images).toEqual([
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
    ]);
  });
});

// ─── Tests: fromOnlineProduct ───────────────────────────────────────────────

describe('fromOnlineProduct', () => {
  it('converts product fields to snake_case row', () => {
    const result = fromOnlineProduct({
      name: 'New Product',
      sku: 'NP-001',
      category: 'pcat-002',
      description: 'A new product',
      retailPrice: 29.99,
      costPrice: 10,
      trackInventory: true,
      stockQuantity: 100,
      lowStockThreshold: 5,
      allowBackorders: true,
      showOnline: true,
      featured: false,
    });

    expect(result.name).toBe('New Product');
    expect(result.sku).toBe('NP-001');
    expect(result.category_id).toBe('pcat-002');
    expect(result.description).toBe('A new product');
    expect(result.price).toBe(29.99);
    expect(result.cost_price).toBe(10);
    expect(result.track_inventory).toBe(true);
    expect(result.stock_quantity).toBe(100);
    expect(result.low_stock_threshold).toBe(5);
    expect(result.allow_backorder).toBe(true);
    expect(result.show_online).toBe(true);
    expect(result.is_featured).toBe(false);
  });

  it('only includes defined fields (partial update)', () => {
    const result = fromOnlineProduct({ name: 'Only Name' });

    expect(result.name).toBe('Only Name');
    expect(result.sku).toBeUndefined();
    expect(result.price).toBeUndefined();
    expect(result.category_id).toBeUndefined();
  });

  it('converts images to JSONB objects with position', () => {
    const result = fromOnlineProduct({
      images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
    });

    expect(result.images).toEqual([
      { url: 'img1.jpg', position: 0 },
      { url: 'img2.jpg', position: 1 },
      { url: 'img3.jpg', position: 2 },
    ]);
  });

  it('converts empty sku to null', () => {
    const result = fromOnlineProduct({ sku: '' });
    expect(result.sku).toBeNull();
  });

  it('converts empty description to null', () => {
    const result = fromOnlineProduct({ description: '' });
    expect(result.description).toBeNull();
  });

  it('converts empty category to null', () => {
    const result = fromOnlineProduct({ category: '' });
    expect(result.category_id).toBeNull();
  });

  it('round-trips key fields correctly', () => {
    const original = toOnlineProduct(productRowFixture);
    const row = fromOnlineProduct(original);

    expect(row.name).toBe(productRowFixture.name);
    expect(row.price).toBe(productRowFixture.price);
    expect(row.cost_price).toBe(productRowFixture.cost_price);
    expect(row.track_inventory).toBe(productRowFixture.track_inventory);
    expect(row.stock_quantity).toBe(productRowFixture.stock_quantity);
    expect(row.low_stock_threshold).toBe(productRowFixture.low_stock_threshold);
    expect(row.allow_backorder).toBe(productRowFixture.allow_backorder);
    expect(row.show_online).toBe(productRowFixture.show_online);
    expect(row.is_featured).toBe(productRowFixture.is_featured);
    expect(row.sku).toBe(productRowFixture.sku);
    expect(row.category_id).toBe(productRowFixture.category_id);
    expect(row.description).toBe(productRowFixture.description);
    expect(row.weight).toBe(productRowFixture.weight);
    expect(row.dimensions).toEqual(productRowFixture.dimensions);
    expect(row.compare_at_price).toBe(productRowFixture.compare_at_price);
  });
});

// ─── Tests: toGiftCardConfig ────────────────────────────────────────────────

describe('toGiftCardConfig', () => {
  it('combines settings and denominations into GiftCardConfig', () => {
    const result = toGiftCardConfig(giftCardSettingsFixture, giftCardDenominationsFixture);

    expect(result.enabled).toBe(true);
    // Only active denominations (denom-003 is inactive)
    expect(result.presetAmounts).toEqual([25, 50]);
    expect(result.allowCustomAmounts).toBe(true);
    expect(result.customAmountMin).toBe(10);
    expect(result.customAmountMax).toBe(500);
    // 365 days / 30 = ~12 months
    expect(result.expiryMonths).toBe(12);
    expect(result.deliveryOptions.digital).toBe(true);
    expect(result.deliveryOptions.physical).toBe(true);
    expect(result.deliveryOptions.messageCharLimit).toBe(200);
  });

  it('filters out inactive denominations', () => {
    const result = toGiftCardConfig(giftCardSettingsFixture, giftCardDenominationsFixture);

    // denom-003 has is_active=false
    expect(result.presetAmounts).toHaveLength(2);
    expect(result.presetAmounts).not.toContain(100);
  });

  it('sorts denominations by display_order', () => {
    const reversed: GiftCardDenominationRow[] = [
      { ...giftCardDenominationsFixture[1], display_order: 5 },
      { ...giftCardDenominationsFixture[0], display_order: 10 },
    ];

    const result = toGiftCardConfig(giftCardSettingsFixture, reversed);

    // $50 (order 5) should come before $25 (order 10)
    expect(result.presetAmounts).toEqual([50, 25]);
  });

  it('handles null expiration days', () => {
    const settings: GiftCardSettingsRow = {
      ...giftCardSettingsFixture,
      default_expiration_days: null,
    };

    const result = toGiftCardConfig(settings, giftCardDenominationsFixture);
    expect(result.expiryMonths).toBeNull();
  });

  it('provides defaults for UI-only fields', () => {
    const result = toGiftCardConfig(giftCardSettingsFixture, giftCardDenominationsFixture);

    expect(result.designs).toEqual([]);
    expect(result.terms).toBe('');
    expect(result.emailTemplate.subject).toBe('You received a gift card!');
    expect(result.emailTemplate.body).toBe('');
  });

  it('handles empty denominations array', () => {
    const result = toGiftCardConfig(giftCardSettingsFixture, []);

    expect(result.presetAmounts).toEqual([]);
  });
});

// ─── Tests: fromGiftCardConfig ──────────────────────────────────────────────

describe('fromGiftCardConfig', () => {
  it('splits config into settings and denominations', () => {
    const result = fromGiftCardConfig({
      enabled: true,
      allowCustomAmounts: true,
      customAmountMin: 25,
      customAmountMax: 250,
      expiryMonths: 6,
      presetAmounts: [25, 50, 100],
      deliveryOptions: { digital: true, physical: true, messageCharLimit: 200 },
    });

    expect(result.settings.online_enabled).toBe(true);
    expect(result.settings.allow_custom_amount).toBe(true);
    expect(result.settings.min_amount).toBe(25);
    expect(result.settings.max_amount).toBe(250);
    expect(result.settings.default_expiration_days).toBe(180); // 6 * 30
    expect(result.settings.email_delivery_enabled).toBe(true);
  });

  it('generates denominations from presetAmounts', () => {
    const result = fromGiftCardConfig({
      presetAmounts: [25, 50, 100],
    });

    expect(result.denominations).toHaveLength(3);
    expect(result.denominations[0]).toEqual({ amount: 25, label: '$25', display_order: 0, is_active: true });
    expect(result.denominations[1]).toEqual({ amount: 50, label: '$50', display_order: 1, is_active: true });
    expect(result.denominations[2]).toEqual({ amount: 100, label: '$100', display_order: 2, is_active: true });
  });

  it('handles null expiryMonths', () => {
    const result = fromGiftCardConfig({ expiryMonths: null });
    expect(result.settings.default_expiration_days).toBeNull();
  });

  it('only includes defined settings fields', () => {
    const result = fromGiftCardConfig({ enabled: false });

    expect(result.settings.online_enabled).toBe(false);
    expect(result.settings.allow_custom_amount).toBeUndefined();
    expect(result.settings.min_amount).toBeUndefined();
  });

  it('returns empty denominations when presetAmounts is missing', () => {
    const result = fromGiftCardConfig({ enabled: true });
    expect(result.denominations).toEqual([]);
  });
});

// ─── Tests: toOnlineMembershipPlan ──────────────────────────────────────────

describe('toOnlineMembershipPlan', () => {
  it('converts a full MembershipPlanRow to a MembershipPlan', () => {
    const result = toOnlineMembershipPlan(membershipPlanRowFixture);

    expect(result.id).toBe('mem-001');
    expect(result.name).toBe('premium');
    expect(result.displayName).toBe('Premium Plan');
    expect(result.priceMonthly).toBe(99.99);
    expect(result.description).toBe('Our premium membership with exclusive perks');
    expect(result.tagline).toBe('The best value for regulars');
    expect(result.imageUrl).toBe('https://example.com/premium.jpg');
    expect(result.badgeIcon).toBe('crown');
    expect(result.color).toBe('#FFD700');
    expect(result.perks).toEqual(['20% off all services', 'Priority booking', 'Free samples']);
    expect(result.features).toEqual({ discountPercentage: 20, priorityBooking: true, freeProductSamples: true });
    expect(result.rules).toEqual({ minCommitmentMonths: 3, cancellationNoticeDays: 30 });
    expect(result.isPopular).toBe(true);
    expect(result.isActive).toBe(true);
    expect(result.sortOrder).toBe(1);
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.updatedAt).toBe('2026-01-15T00:00:00.000Z');
  });

  it('handles null/empty optional fields', () => {
    const minimalRow: MembershipPlanRow = {
      ...membershipPlanRowFixture,
      description: null,
      tagline: null,
      image_url: null,
      badge_icon: null,
      color: null,
    };

    const result = toOnlineMembershipPlan(minimalRow);

    expect(result.description).toBe('');
    expect(result.tagline).toBe('');
    expect(result.imageUrl).toBe('');
    expect(result.badgeIcon).toBe('');
    expect(result.color).toBe('');
  });

  it('handles non-array perks field', () => {
    const row: MembershipPlanRow = {
      ...membershipPlanRowFixture,
      perks: null as unknown as string[],
    };

    const result = toOnlineMembershipPlan(row);
    expect(result.perks).toEqual([]);
  });

  it('handles falsy features and rules', () => {
    const row: MembershipPlanRow = {
      ...membershipPlanRowFixture,
      features: null as unknown as typeof membershipPlanRowFixture.features,
      rules: null as unknown as typeof membershipPlanRowFixture.rules,
    };

    const result = toOnlineMembershipPlan(row);
    expect(result.features).toEqual({});
    expect(result.rules).toEqual({});
  });

  it('converts price_monthly to number', () => {
    const row: MembershipPlanRow = {
      ...membershipPlanRowFixture,
      price_monthly: '49.99' as unknown as number, // DECIMAL comes as string from some Supabase responses
    };

    const result = toOnlineMembershipPlan(row);
    expect(result.priceMonthly).toBe(49.99);
    expect(typeof result.priceMonthly).toBe('number');
  });
});

// ─── Tests: fromOnlineMembershipPlan ────────────────────────────────────────

describe('fromOnlineMembershipPlan', () => {
  it('converts membership plan fields to snake_case row', () => {
    const result = fromOnlineMembershipPlan({
      name: 'basic',
      displayName: 'Basic Plan',
      priceMonthly: 29.99,
      description: 'Basic membership',
      tagline: 'Great starter plan',
      imageUrl: 'https://example.com/basic.jpg',
      badgeIcon: 'star',
      color: '#4CAF50',
      perks: ['10% discount'],
      features: { discountPercentage: 10 },
      rules: { minCommitmentMonths: 1 },
      isPopular: false,
      isActive: true,
      sortOrder: 2,
    });

    expect(result.name).toBe('basic');
    expect(result.display_name).toBe('Basic Plan');
    expect(result.price_monthly).toBe(29.99);
    expect(result.description).toBe('Basic membership');
    expect(result.tagline).toBe('Great starter plan');
    expect(result.image_url).toBe('https://example.com/basic.jpg');
    expect(result.badge_icon).toBe('star');
    expect(result.color).toBe('#4CAF50');
    expect(result.perks).toEqual(['10% discount']);
    expect(result.features).toEqual({ discountPercentage: 10 });
    expect(result.rules).toEqual({ minCommitmentMonths: 1 });
    expect(result.is_popular).toBe(false);
    expect(result.is_active).toBe(true);
    expect(result.sort_order).toBe(2);
  });

  it('only includes defined fields (partial update)', () => {
    const result = fromOnlineMembershipPlan({ name: 'updated-name' });

    expect(result.name).toBe('updated-name');
    expect(result.display_name).toBeUndefined();
    expect(result.price_monthly).toBeUndefined();
    expect(result.perks).toBeUndefined();
  });

  it('converts empty strings to null for nullable DB columns', () => {
    const result = fromOnlineMembershipPlan({
      description: '',
      tagline: '',
      imageUrl: '',
      badgeIcon: '',
      color: '',
    });

    expect(result.description).toBeNull();
    expect(result.tagline).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.badge_icon).toBeNull();
    expect(result.color).toBeNull();
  });

  it('round-trips key fields correctly', () => {
    const original = toOnlineMembershipPlan(membershipPlanRowFixture);
    const row = fromOnlineMembershipPlan(original);

    expect(row.name).toBe(membershipPlanRowFixture.name);
    expect(row.display_name).toBe(membershipPlanRowFixture.display_name);
    expect(row.price_monthly).toBe(membershipPlanRowFixture.price_monthly);
    expect(row.description).toBe(membershipPlanRowFixture.description);
    expect(row.tagline).toBe(membershipPlanRowFixture.tagline);
    expect(row.image_url).toBe(membershipPlanRowFixture.image_url);
    expect(row.badge_icon).toBe(membershipPlanRowFixture.badge_icon);
    expect(row.color).toBe(membershipPlanRowFixture.color);
    expect(row.perks).toEqual(membershipPlanRowFixture.perks);
    expect(row.features).toEqual(membershipPlanRowFixture.features);
    expect(row.rules).toEqual(membershipPlanRowFixture.rules);
    expect(row.is_popular).toBe(membershipPlanRowFixture.is_popular);
    expect(row.is_active).toBe(membershipPlanRowFixture.is_active);
    expect(row.sort_order).toBe(membershipPlanRowFixture.sort_order);
  });
});
