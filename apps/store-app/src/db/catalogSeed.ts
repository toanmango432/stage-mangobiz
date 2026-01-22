/**
 * Catalog Module Seed Data
 * Seeds the catalog tables with sample data for fresh installs
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type {
  ServiceCategory,
  MenuService,
  ServiceVariant,
  ServicePackage,
  PackageServiceItem,
  BundleBookingMode,
  AddOnGroup,
  AddOnOption,
  CatalogSettings,
} from '../types';
import type { SyncStatus, VectorClock } from '../types/common';

const DEFAULT_SALON_ID = 'default-salon'; // Default salon ID for fallback
const DEFAULT_TENANT_ID = 'default-tenant'; // Default tenant ID for fallback
const DEFAULT_DEVICE_ID = 'seed-device'; // Device ID for seeded data

/**
 * Creates sync-related fields for seeded data
 * Uses 'synced' status since seed data doesn't need to be synced upstream
 */
function createSeedSyncFields(storeId: string, tenantId: string = DEFAULT_TENANT_ID): {
  tenantId: string;
  syncStatus: SyncStatus;
  version: number;
  vectorClock: VectorClock;
  lastSyncedVersion: number;
  createdByDevice: string;
  lastModifiedByDevice: string;
  isDeleted: boolean;
} {
  return {
    tenantId,
    syncStatus: 'synced' as SyncStatus,
    version: 1,
    vectorClock: { [DEFAULT_DEVICE_ID]: 1 },
    lastSyncedVersion: 1,
    createdByDevice: DEFAULT_DEVICE_ID,
    lastModifiedByDevice: DEFAULT_DEVICE_ID,
    isDeleted: false,
  };
}

/**
 * Creates a ServiceVariant with all sync fields
 */
function createSeedVariant(
  storeId: string,
  serviceId: string,
  name: string,
  duration: number,
  price: number,
  isDefault: boolean,
  displayOrder: number,
  now: string,
  tenantId: string = DEFAULT_TENANT_ID
): ServiceVariant {
  return {
    id: uuidv4(),
    storeId,
    tenantId,
    serviceId,
    name,
    duration,
    price,
    isDefault,
    displayOrder,
    isActive: true,
    syncStatus: 'synced' as SyncStatus,
    version: 1,
    vectorClock: { [DEFAULT_DEVICE_ID]: 1 },
    lastSyncedVersion: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    createdByDevice: DEFAULT_DEVICE_ID,
    lastModifiedBy: 'system',
    lastModifiedByDevice: DEFAULT_DEVICE_ID,
    isDeleted: false,
  };
}

/**
 * Creates a ServicePackage with all sync fields
 */
function createSeedPackage(
  storeId: string,
  name: string,
  description: string,
  services: PackageServiceItem[],
  originalPrice: number,
  packagePrice: number,
  discountType: 'fixed' | 'percentage',
  discountValue: number,
  bookingMode: BundleBookingMode,
  displayOrder: number,
  color: string,
  now: string,
  validityDays?: number,
  tenantId: string = DEFAULT_TENANT_ID
): ServicePackage {
  return {
    id: uuidv4(),
    storeId,
    tenantId,
    name,
    description,
    services,
    originalPrice,
    packagePrice,
    discountType,
    discountValue,
    bookingMode,
    validityDays,
    bookingAvailability: 'both',
    onlineBookingEnabled: true,
    isActive: true,
    displayOrder,
    color,
    syncStatus: 'synced' as SyncStatus,
    version: 1,
    vectorClock: { [DEFAULT_DEVICE_ID]: 1 },
    lastSyncedVersion: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    createdByDevice: DEFAULT_DEVICE_ID,
    lastModifiedBy: 'system',
    lastModifiedByDevice: DEFAULT_DEVICE_ID,
    isDeleted: false,
  };
}

/**
 * Creates an AddOnGroup with all sync fields
 */
function createSeedAddOnGroup(
  storeId: string,
  name: string,
  description: string,
  selectionMode: 'single' | 'multiple',
  minSelections: number,
  maxSelections: number,
  isRequired: boolean,
  applicableToAll: boolean,
  applicableCategoryIds: string[],
  applicableServiceIds: string[],
  displayOrder: number,
  onlineBookingEnabled: boolean,
  now: string,
  tenantId: string = DEFAULT_TENANT_ID
): AddOnGroup {
  return {
    id: uuidv4(),
    storeId,
    tenantId,
    name,
    description,
    selectionMode,
    minSelections,
    maxSelections,
    isRequired,
    applicableToAll,
    applicableCategoryIds,
    applicableServiceIds,
    isActive: true,
    displayOrder,
    onlineBookingEnabled,
    syncStatus: 'synced' as SyncStatus,
    version: 1,
    vectorClock: { [DEFAULT_DEVICE_ID]: 1 },
    lastSyncedVersion: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    createdByDevice: DEFAULT_DEVICE_ID,
    lastModifiedBy: 'system',
    lastModifiedByDevice: DEFAULT_DEVICE_ID,
    isDeleted: false,
  };
}

/**
 * Creates an AddOnOption with all sync fields
 */
function createSeedAddOnOption(
  storeId: string,
  groupId: string,
  name: string,
  description: string,
  price: number,
  duration: number,
  displayOrder: number,
  now: string,
  tenantId: string = DEFAULT_TENANT_ID
): AddOnOption {
  return {
    id: uuidv4(),
    storeId,
    tenantId,
    groupId,
    name,
    description,
    price,
    duration,
    isActive: true,
    displayOrder,
    syncStatus: 'synced' as SyncStatus,
    version: 1,
    vectorClock: { [DEFAULT_DEVICE_ID]: 1 },
    lastSyncedVersion: 1,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    createdByDevice: DEFAULT_DEVICE_ID,
    lastModifiedBy: 'system',
    lastModifiedByDevice: DEFAULT_DEVICE_ID,
    isDeleted: false,
  };
}

// Category Color Palette (Fresha-inspired)
const CATEGORY_COLORS = [
  '#F43F5E', // Rose
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#6366F1', // Indigo
];

/**
 * Seeds the catalog with sample data for a store.
 * @param storeId - The store ID to seed data for (defaults to 'default-salon' for dev mode)
 */
export async function seedCatalog(storeId: string = DEFAULT_SALON_ID) {
  console.log('🌱 Seeding catalog data for storeId:', storeId);

  // Clear existing catalog data
  await db.serviceCategories.clear();
  await db.menuServices.clear();
  await db.serviceVariants.clear();
  await db.servicePackages.clear();
  await db.addOnGroups.clear();
  await db.addOnOptions.clear();
  await db.catalogSettings.clear();

  const now = new Date().toISOString();
  const syncFields = createSeedSyncFields(storeId);

  // ==================== CATEGORIES ====================
  const categories: ServiceCategory[] = [
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      name: 'Hair Services',
      description: 'Haircuts, styling, and treatments',
      color: CATEGORY_COLORS[0],
      icon: 'Scissors',
      displayOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      name: 'Hair Color',
      description: 'Coloring, highlights, and balayage',
      color: CATEGORY_COLORS[1],
      icon: 'Paintbrush',
      displayOrder: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      name: 'Nail Services',
      description: 'Manicures, pedicures, and nail art',
      color: CATEGORY_COLORS[2],
      icon: 'Sparkles',
      displayOrder: 3,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      name: 'Spa & Massage',
      description: 'Relaxation and therapeutic treatments',
      color: CATEGORY_COLORS[3],
      icon: 'Leaf',
      displayOrder: 4,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      name: 'Facial & Skincare',
      description: 'Facials, peels, and skin treatments',
      color: CATEGORY_COLORS[4],
      icon: 'Droplet',
      displayOrder: 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      name: 'Waxing',
      description: 'Body and facial waxing services',
      color: CATEGORY_COLORS[5],
      icon: 'Flame',
      displayOrder: 6,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      name: 'Makeup',
      description: 'Professional makeup services',
      color: CATEGORY_COLORS[6],
      icon: 'Palette',
      displayOrder: 7,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      name: 'Lashes & Brows',
      description: 'Eyelash extensions and brow services',
      color: CATEGORY_COLORS[7],
      icon: 'Star',
      displayOrder: 8,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
  ];

  await db.serviceCategories.bulkAdd(categories);
  console.log(`✅ Seeded ${categories.length} service categories`);

  // ==================== SERVICES & VARIANTS ====================
  const services: MenuService[] = [];
  const variants: ServiceVariant[] = [];

  // Hair Services (Category 0)
  const hairCatId = categories[0].id;

  // Women's Haircut - with variants
  const womensHaircut: MenuService = {
    id: uuidv4(),
    storeId,
    ...syncFields,
    categoryId: hairCatId,
    name: "Women's Haircut",
    description: 'Consultation, shampoo, cut, and style',
    pricingType: 'from',
    price: 65,
    duration: 60,
    hasVariants: true,
    variantCount: 3,
    allStaffCanPerform: true,
    bookingAvailability: 'both',
    onlineBookingEnabled: true,
    requiresDeposit: false,
    taxable: true,
    status: 'active',
    displayOrder: 1,
    showPriceOnline: true,
    allowCustomDuration: false,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    lastModifiedBy: 'system',
  };
  services.push(womensHaircut);

  variants.push(
    createSeedVariant(storeId, womensHaircut.id, 'Short Hair', 45, 65, true, 1, now),
    createSeedVariant(storeId, womensHaircut.id, 'Medium Hair', 60, 75, false, 2, now),
    createSeedVariant(storeId, womensHaircut.id, 'Long Hair', 75, 85, false, 3, now),
  );

  // Men's Haircut - no variants
  services.push({
    id: uuidv4(),
    storeId,
    ...syncFields,
    categoryId: hairCatId,
    name: "Men's Haircut",
    description: 'Classic cut with neck cleanup',
    pricingType: 'fixed',
    price: 35,
    duration: 30,
    hasVariants: false,
    variantCount: 0,
    allStaffCanPerform: true,
    bookingAvailability: 'both',
    onlineBookingEnabled: true,
    requiresDeposit: false,
    taxable: true,
    status: 'active',
    displayOrder: 2,
    showPriceOnline: true,
    allowCustomDuration: false,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    lastModifiedBy: 'system',
  });

  // Blowout & Style - with variants
  const blowout: MenuService = {
    id: uuidv4(),
    storeId,
    ...syncFields,
    categoryId: hairCatId,
    name: 'Blowout & Style',
    description: 'Shampoo and professional blowdry styling',
    pricingType: 'from',
    price: 45,
    duration: 45,
    hasVariants: true,
    variantCount: 3,
    allStaffCanPerform: true,
    bookingAvailability: 'both',
    onlineBookingEnabled: true,
    requiresDeposit: false,
    taxable: true,
    status: 'active',
    displayOrder: 3,
    showPriceOnline: true,
    allowCustomDuration: false,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    lastModifiedBy: 'system',
  };
  services.push(blowout);

  variants.push(
    createSeedVariant(storeId, blowout.id, 'Short/Medium', 45, 45, true, 1, now),
    createSeedVariant(storeId, blowout.id, 'Long Hair', 60, 55, false, 2, now),
    createSeedVariant(storeId, blowout.id, 'Extra Long', 75, 65, false, 3, now),
  );

  // Deep Conditioning
  services.push({
    id: uuidv4(),
    storeId,
    ...syncFields,
    categoryId: hairCatId,
    name: 'Deep Conditioning Treatment',
    description: 'Intensive hydration and repair treatment',
    pricingType: 'fixed',
    price: 35,
    duration: 30,
    extraTime: 15,
    extraTimeType: 'processing',
    hasVariants: false,
    variantCount: 0,
    allStaffCanPerform: true,
    bookingAvailability: 'both',
    onlineBookingEnabled: true,
    requiresDeposit: false,
    taxable: true,
    status: 'active',
    displayOrder: 4,
    showPriceOnline: true,
    allowCustomDuration: false,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    lastModifiedBy: 'system',
  });

  // Hair Color (Category 1)
  const colorCatId = categories[1].id;

  const fullColor: MenuService = {
    id: uuidv4(),
    storeId,
    ...syncFields,
    categoryId: colorCatId,
    name: 'Full Color',
    description: 'Single process all-over color',
    pricingType: 'from',
    price: 95,
    duration: 90,
    extraTime: 30,
    extraTimeType: 'processing',
    hasVariants: true,
    variantCount: 3,
    allStaffCanPerform: false,
    bookingAvailability: 'both',
    onlineBookingEnabled: true,
    requiresDeposit: true,
    depositPercentage: 25,
    taxable: true,
    status: 'active',
    displayOrder: 1,
    showPriceOnline: true,
    allowCustomDuration: false,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    lastModifiedBy: 'system',
  };
  services.push(fullColor);

  variants.push(
    createSeedVariant(storeId, fullColor.id, 'Short Hair', 90, 95, true, 1, now),
    createSeedVariant(storeId, fullColor.id, 'Medium Hair', 105, 115, false, 2, now),
    createSeedVariant(storeId, fullColor.id, 'Long Hair', 120, 135, false, 3, now),
  );

  // Nail Services (Category 2)
  const nailCatId = categories[2].id;

  services.push(
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      categoryId: nailCatId,
      name: 'Classic Manicure',
      description: 'Nail shaping, cuticle care, and polish',
      pricingType: 'fixed',
      price: 28,
      duration: 30,
      hasVariants: false,
      variantCount: 0,
      allStaffCanPerform: true,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      requiresDeposit: false,
      taxable: true,
      status: 'active',
      displayOrder: 1,
      showPriceOnline: true,
      allowCustomDuration: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      categoryId: nailCatId,
      name: 'Gel Manicure',
      description: 'Long-lasting gel polish manicure',
      pricingType: 'fixed',
      price: 45,
      duration: 45,
      hasVariants: false,
      variantCount: 0,
      allStaffCanPerform: true,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      requiresDeposit: false,
      taxable: true,
      status: 'active',
      displayOrder: 2,
      showPriceOnline: true,
      allowCustomDuration: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      categoryId: nailCatId,
      name: 'Deluxe Pedicure',
      description: 'Full pedicure with extended massage and mask',
      pricingType: 'fixed',
      price: 55,
      duration: 60,
      hasVariants: false,
      variantCount: 0,
      allStaffCanPerform: true,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      requiresDeposit: false,
      taxable: true,
      status: 'active',
      displayOrder: 3,
      showPriceOnline: true,
      allowCustomDuration: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
  );

  // Spa & Massage (Category 3)
  const spaCatId = categories[3].id;

  const swedishMassage: MenuService = {
    id: uuidv4(),
    storeId,
    ...syncFields,
    categoryId: spaCatId,
    name: 'Swedish Massage',
    description: 'Classic relaxation massage',
    pricingType: 'from',
    price: 85,
    duration: 60,
    hasVariants: true,
    variantCount: 3,
    allStaffCanPerform: false,
    bookingAvailability: 'both',
    onlineBookingEnabled: true,
    requiresDeposit: true,
    depositPercentage: 20,
    taxable: true,
    status: 'active',
    displayOrder: 1,
    showPriceOnline: true,
    allowCustomDuration: false,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    lastModifiedBy: 'system',
  };
  services.push(swedishMassage);

  variants.push(
    createSeedVariant(storeId, swedishMassage.id, '60 Minutes', 60, 85, true, 1, now),
    createSeedVariant(storeId, swedishMassage.id, '90 Minutes', 90, 125, false, 2, now),
    createSeedVariant(storeId, swedishMassage.id, '120 Minutes', 120, 165, false, 3, now),
  );

  // Facial (Category 4)
  const facialCatId = categories[4].id;

  services.push(
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      categoryId: facialCatId,
      name: 'Express Facial',
      description: 'Quick refresh facial treatment',
      pricingType: 'fixed',
      price: 65,
      duration: 30,
      hasVariants: false,
      variantCount: 0,
      allStaffCanPerform: false,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      requiresDeposit: false,
      taxable: true,
      status: 'active',
      displayOrder: 1,
      showPriceOnline: true,
      allowCustomDuration: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
    {
      id: uuidv4(),
      storeId,
      ...syncFields,
      categoryId: facialCatId,
      name: 'Signature Facial',
      description: 'Full customized facial with extractions',
      pricingType: 'fixed',
      price: 125,
      duration: 75,
      hasVariants: false,
      variantCount: 0,
      allStaffCanPerform: false,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      requiresDeposit: true,
      depositPercentage: 20,
      taxable: true,
      status: 'active',
      displayOrder: 2,
      showPriceOnline: true,
      allowCustomDuration: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
    },
  );

  await db.menuServices.bulkAdd(services);
  console.log(`✅ Seeded ${services.length} menu services`);

  await db.serviceVariants.bulkAdd(variants);
  console.log(`✅ Seeded ${variants.length} service variants`);

  // ==================== PACKAGES ====================
  const packages: ServicePackage[] = [
    createSeedPackage(
      storeId,
      'Bridal Beauty Package',
      'Complete bridal preparation including hair, makeup, and nails',
      [
        { serviceId: services[0].id, serviceName: "Women's Haircut", quantity: 1, originalPrice: 75 },
        { serviceId: services[2].id, serviceName: 'Blowout & Style', quantity: 1, originalPrice: 55 },
        { serviceId: services[6].id, serviceName: 'Gel Manicure', quantity: 1, originalPrice: 45 },
      ],
      175,
      149,
      'fixed',
      26,
      'single-session',
      1,
      '#EC4899',
      now
    ),
    createSeedPackage(
      storeId,
      'Spa Day Escape',
      'Ultimate relaxation with massage and facial',
      [
        { serviceId: services[8].id, serviceName: 'Swedish Massage', quantity: 1, originalPrice: 125 },
        { serviceId: services[10].id, serviceName: 'Signature Facial', quantity: 1, originalPrice: 125 },
      ],
      250,
      215,
      'percentage',
      14,
      'single-session',
      2,
      '#14B8A6',
      now,
      90
    ),
  ];

  await db.servicePackages.bulkAdd(packages);
  console.log(`✅ Seeded ${packages.length} service packages`);

  // ==================== ADD-ON GROUPS & OPTIONS ====================
  const addOnGroups: AddOnGroup[] = [];
  const addOnOptions: AddOnOption[] = [];

  // Hair Add-ons Group
  const hairAddOnsGroup = createSeedAddOnGroup(
    storeId,
    'Hair Enhancements',
    'Additional treatments for hair services',
    'multiple',
    0,
    3,
    false,
    false,
    [categories[0].id, categories[1].id],
    [],
    1,
    true,
    now
  );
  addOnGroups.push(hairAddOnsGroup);

  addOnOptions.push(
    createSeedAddOnOption(storeId, hairAddOnsGroup.id, 'Scalp Massage', 'Relaxing scalp massage', 15, 10, 1, now),
    createSeedAddOnOption(storeId, hairAddOnsGroup.id, 'Deep Conditioning', 'Intensive treatment', 25, 15, 2, now),
    createSeedAddOnOption(storeId, hairAddOnsGroup.id, 'Gloss Treatment', 'High-shine gloss', 35, 15, 3, now),
  );

  // Nail Add-ons Group
  const nailAddOnsGroup = createSeedAddOnGroup(
    storeId,
    'Nail Extras',
    'Enhance your nail service',
    'multiple',
    0,
    5,
    false,
    false,
    [categories[2].id],
    [],
    2,
    true,
    now
  );
  addOnGroups.push(nailAddOnsGroup);

  addOnOptions.push(
    createSeedAddOnOption(storeId, nailAddOnsGroup.id, 'Paraffin Treatment', 'Moisturizing wax', 12, 10, 1, now),
    createSeedAddOnOption(storeId, nailAddOnsGroup.id, 'Nail Art (per nail)', 'Custom design', 5, 5, 2, now),
    createSeedAddOnOption(storeId, nailAddOnsGroup.id, 'Gel Removal', 'Safe gel polish removal', 10, 10, 3, now),
  );

  // Massage Add-ons Group
  const massageAddOnsGroup = createSeedAddOnGroup(
    storeId,
    'Massage Enhancements',
    'Upgrade your massage experience',
    'multiple',
    0,
    2,
    false,
    false,
    [categories[3].id],
    [],
    3,
    true,
    now
  );
  addOnGroups.push(massageAddOnsGroup);

  addOnOptions.push(
    createSeedAddOnOption(storeId, massageAddOnsGroup.id, 'Hot Stone Enhancement', 'Add hot stones', 25, 15, 1, now),
    createSeedAddOnOption(storeId, massageAddOnsGroup.id, 'Aromatherapy', 'Essential oil upgrade', 15, 0, 2, now),
  );

  await db.addOnGroups.bulkAdd(addOnGroups);
  console.log(`✅ Seeded ${addOnGroups.length} add-on groups`);

  await db.addOnOptions.bulkAdd(addOnOptions);
  console.log(`✅ Seeded ${addOnOptions.length} add-on options`);

  // ==================== CATALOG SETTINGS ====================
  const settings: CatalogSettings = {
    id: uuidv4(),
    storeId,
    defaultDuration: 60,
    defaultExtraTime: 0,
    defaultExtraTimeType: 'processing',
    defaultTaxRate: 0,
    currency: 'USD',
    currencySymbol: '$',
    showPricesOnline: true,
    requireDepositForOnlineBooking: false,
    defaultDepositPercentage: 20,
    enablePackages: true,
    enableAddOns: true,
    enableVariants: true,
    allowCustomPricing: true,
    bookingSequenceEnabled: false,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  };

  await db.catalogSettings.add(settings);
  console.log('✅ Seeded catalog settings');

  console.log('🎉 Catalog seeding complete!');

  return {
    categories,
    services,
    variants,
    packages,
    addOnGroups,
    addOnOptions,
    settings,
  };
}

// Check if catalog needs seeding (empty tables)
export async function needsCatalogSeed(storeId: string = DEFAULT_SALON_ID): Promise<boolean> {
  const categoryCount = await db.serviceCategories.where('storeId').equals(storeId).count();
  return categoryCount === 0;
}

// ==================== MIGRATION ====================

/**
 * Migrate data from old `services` table to new catalog tables.
 * This handles the transition from the legacy Service type to MenuService + ServiceVariants.
 *
 * @param storeId - The salon to migrate
 * @returns Migration result with counts
 */
export async function migrateServicesToCatalog(storeId: string): Promise<{
  migrated: number;
  categoriesCreated: number;
  skipped: number;
}> {
  console.log('🔄 Starting services to catalog migration...');

  // Get existing legacy services
  const legacyServices = await db.services.where('storeId').equals(storeId).toArray();

  if (legacyServices.length === 0) {
    console.log('ℹ️ No legacy services to migrate');
    return { migrated: 0, categoriesCreated: 0, skipped: 0 };
  }

  // Check if already migrated (if menuServices has data for this salon)
  const existingMenuServices = await db.menuServices.where('storeId').equals(storeId).count();
  if (existingMenuServices > 0) {
    console.log('ℹ️ Catalog already has data, skipping migration');
    return { migrated: 0, categoriesCreated: 0, skipped: legacyServices.length };
  }

  const now = new Date().toISOString();
  let migrated = 0;
  let categoriesCreated = 0;
  const categoryMap = new Map<string, string>(); // category name -> category ID

  // First, create categories from unique category names
  const uniqueCategories = [...new Set(legacyServices.map(s => s.category).filter(Boolean))];

  const migrationSyncFields = createSeedSyncFields(storeId);
  migrationSyncFields.syncStatus = 'local'; // Migration data needs to be synced

  for (let i = 0; i < uniqueCategories.length; i++) {
    const catName = uniqueCategories[i];
    const categoryId = uuidv4();
    categoryMap.set(catName, categoryId);

    const category: ServiceCategory = {
      id: categoryId,
      storeId,
      ...migrationSyncFields,
      name: catName,
      description: '',
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      displayOrder: i + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'migration',
      lastModifiedBy: 'migration',
    };

    await db.serviceCategories.add(category);
    categoriesCreated++;
  }

  console.log(`✅ Created ${categoriesCreated} categories from legacy data`);

  // Now migrate services
  for (const legacyService of legacyServices) {
    const categoryId = categoryMap.get(legacyService.category) || '';

    // Skip services without a valid category
    if (!categoryId && legacyService.category) {
      console.warn(`⚠️ Skipping service "${legacyService.name}": category "${legacyService.category}" not found`);
      continue;
    }

    // Create the new MenuService
    const menuService: MenuService = {
      id: legacyService.id, // Keep same ID for continuity
      storeId,
      ...migrationSyncFields,
      categoryId,
      name: legacyService.name,
      description: legacyService.description || '',
      pricingType: 'fixed',
      price: legacyService.price,
      duration: legacyService.duration,
      hasVariants: false,
      variantCount: 0,
      allStaffCanPerform: true,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      requiresDeposit: false,
      taxable: true,
      status: legacyService.isActive ? 'active' : 'inactive',
      displayOrder: migrated + 1,
      showPriceOnline: true,
      allowCustomDuration: false,
      // Legacy field mapping
      commissionRate: (legacyService as any).commissionRate,
      createdAt: legacyService.createdAt || now,
      updatedAt: now,
      createdBy: 'migration',
      lastModifiedBy: 'migration',
    };

    await db.menuServices.add(menuService);
    migrated++;
  }

  console.log(`✅ Migrated ${migrated} services to catalog`);

  // Create default catalog settings if not exists
  const existingSettings = await db.catalogSettings.where('storeId').equals(storeId).first();
  if (!existingSettings) {
    await db.catalogSettings.add({
      id: uuidv4(),
      storeId,
      defaultDuration: 60,
      defaultExtraTime: 0,
      defaultExtraTimeType: 'processing' as const,
      defaultTaxRate: 0,
      currency: 'USD',
      currencySymbol: '$',
      showPricesOnline: true,
      requireDepositForOnlineBooking: false,
      defaultDepositPercentage: 20,
      enablePackages: true,
      enableAddOns: true,
      enableVariants: true,
      allowCustomPricing: true,
      bookingSequenceEnabled: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    } as any);
    console.log('✅ Created default catalog settings');
  }

  console.log('🎉 Migration complete!');

  return { migrated, categoriesCreated, skipped: 0 };
}

/**
 * Initialize catalog for a salon.
 * - If legacy services exist, migrate them
 * - If no data exists, optionally seed with sample data
 *
 * @param storeId - The salon to initialize
 * @param seedIfEmpty - Whether to seed sample data if no services exist
 */
export async function initializeCatalog(
  storeId: string,
  seedIfEmpty: boolean = false
): Promise<{
  action: 'migrated' | 'seeded' | 'existing' | 'empty';
  details?: any;
}> {
  // Check for existing catalog data
  const existingCategories = await db.serviceCategories.where('storeId').equals(storeId).count();
  const existingServices = await db.menuServices.where('storeId').equals(storeId).count();

  if (existingCategories > 0 || existingServices > 0) {
    console.log('ℹ️ Catalog already initialized');
    return { action: 'existing', details: { categories: existingCategories, services: existingServices } };
  }

  // Check for legacy services to migrate
  const legacyServices = await db.services.where('storeId').equals(storeId).count();

  if (legacyServices > 0) {
    const result = await migrateServicesToCatalog(storeId);
    return { action: 'migrated', details: result };
  }

  // No data exists - optionally seed with the correct storeId
  if (seedIfEmpty) {
    const result = await seedCatalog(storeId);
    return { action: 'seeded', details: result };
  }

  return { action: 'empty' };
}

/**
 * Migrate catalog data from one storeId to another.
 * Used when catalog was seeded with 'default-salon' but user logs in with a different storeId.
 *
 * @param fromStoreId - The original storeId (e.g., 'default-salon')
 * @param toStoreId - The target storeId (e.g., actual auth storeId)
 * @returns Migration result with counts
 */
export async function migrateCatalogToStore(
  fromStoreId: string,
  toStoreId: string
): Promise<{
  migrated: boolean;
  categories: number;
  services: number;
  variants: number;
  packages: number;
  addOnGroups: number;
  addOnOptions: number;
  settings: number;
}> {
  console.log(`🔄 Migrating catalog from "${fromStoreId}" to "${toStoreId}"...`);

  // Skip if same storeId
  if (fromStoreId === toStoreId) {
    console.log('ℹ️ Source and target storeId are the same, skipping migration');
    return { migrated: false, categories: 0, services: 0, variants: 0, packages: 0, addOnGroups: 0, addOnOptions: 0, settings: 0 };
  }

  // Check if target already has data
  const existingCategoriesInTarget = await db.serviceCategories.where('storeId').equals(toStoreId).count();
  const existingServicesInTarget = await db.menuServices.where('storeId').equals(toStoreId).count();

  if (existingCategoriesInTarget > 0 || existingServicesInTarget > 0) {
    console.log(`ℹ️ Target storeId "${toStoreId}" already has catalog data, skipping migration`);
    return { migrated: false, categories: 0, services: 0, variants: 0, packages: 0, addOnGroups: 0, addOnOptions: 0, settings: 0 };
  }

  // Fetch all data from source storeId
  const categories = await db.serviceCategories.where('storeId').equals(fromStoreId).toArray();
  const services = await db.menuServices.where('storeId').equals(fromStoreId).toArray();
  const variants = await db.serviceVariants.where('storeId').equals(fromStoreId).toArray();
  const packages = await db.servicePackages.where('storeId').equals(fromStoreId).toArray();
  const addOnGroups = await db.addOnGroups.where('storeId').equals(fromStoreId).toArray();
  const addOnOptions = await db.addOnOptions.where('storeId').equals(fromStoreId).toArray();
  const settings = await db.catalogSettings.where('storeId').equals(fromStoreId).toArray();

  // Check if source has data
  if (categories.length === 0 && services.length === 0) {
    console.log(`ℹ️ No catalog data found in source storeId "${fromStoreId}"`);
    return { migrated: false, categories: 0, services: 0, variants: 0, packages: 0, addOnGroups: 0, addOnOptions: 0, settings: 0 };
  }

  console.log(`📦 Found ${categories.length} categories, ${services.length} services to migrate`);

  // Update all records with new storeId
  const now = new Date().toISOString();

  await db.transaction('rw', [
    db.serviceCategories,
    db.menuServices,
    db.serviceVariants,
    db.servicePackages,
    db.addOnGroups,
    db.addOnOptions,
    db.catalogSettings,
  ], async () => {
    // Migrate categories
    for (const cat of categories) {
      await db.serviceCategories.update(cat.id, { storeId: toStoreId, updatedAt: now });
    }

    // Migrate services
    for (const svc of services) {
      await db.menuServices.update(svc.id, { storeId: toStoreId, updatedAt: now });
    }

    // Migrate variants
    for (const v of variants) {
      await db.serviceVariants.update(v.id, { storeId: toStoreId, updatedAt: now });
    }

    // Migrate packages
    for (const pkg of packages) {
      await db.servicePackages.update(pkg.id, { storeId: toStoreId, updatedAt: now });
    }

    // Migrate add-on groups
    for (const grp of addOnGroups) {
      await db.addOnGroups.update(grp.id, { storeId: toStoreId, updatedAt: now });
    }

    // Migrate add-on options
    for (const opt of addOnOptions) {
      await db.addOnOptions.update(opt.id, { storeId: toStoreId, updatedAt: now });
    }

    // Migrate settings
    for (const s of settings) {
      await db.catalogSettings.update(s.id, { storeId: toStoreId, updatedAt: now });
    }
  });

  console.log(`✅ Migrated catalog data to storeId "${toStoreId}"`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Services: ${services.length}`);
  console.log(`   Variants: ${variants.length}`);
  console.log(`   Packages: ${packages.length}`);
  console.log(`   Add-on Groups: ${addOnGroups.length}`);
  console.log(`   Add-on Options: ${addOnOptions.length}`);
  console.log(`   Settings: ${settings.length}`);

  return {
    migrated: true,
    categories: categories.length,
    services: services.length,
    variants: variants.length,
    packages: packages.length,
    addOnGroups: addOnGroups.length,
    addOnOptions: addOnOptions.length,
    settings: settings.length,
  };
}
