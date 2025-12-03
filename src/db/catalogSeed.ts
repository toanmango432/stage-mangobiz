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
  AddOnGroup,
  AddOnOption,
  CatalogSettings,
} from '../types';

const SALON_ID = 'default-salon'; // Default salon ID matching seed.ts and auth fallback

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

export async function seedCatalog() {
  console.log('🌱 Seeding catalog data...');

  // Clear existing catalog data
  await db.serviceCategories.clear();
  await db.menuServices.clear();
  await db.serviceVariants.clear();
  await db.servicePackages.clear();
  await db.addOnGroups.clear();
  await db.addOnOptions.clear();
  await db.catalogSettings.clear();

  const now = new Date();

  // ==================== CATEGORIES ====================
  const categories: ServiceCategory[] = [
    {
      id: uuidv4(),
      salonId: SALON_ID,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
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
      syncStatus: 'synced',
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
    salonId: SALON_ID,
    categoryId: hairCatId,
    name: "Women's Haircut",
    description: 'Consultation, shampoo, cut, and style',
    pricingType: 'from',
    price: 65,
    duration: 60,
    hasVariants: true,
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
    syncStatus: 'synced',
  };
  services.push(womensHaircut);

  variants.push(
    { id: uuidv4(), salonId: SALON_ID, serviceId: womensHaircut.id, name: 'Short Hair', duration: 45, price: 65, isDefault: true, displayOrder: 1, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, serviceId: womensHaircut.id, name: 'Medium Hair', duration: 60, price: 75, isDefault: false, displayOrder: 2, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, serviceId: womensHaircut.id, name: 'Long Hair', duration: 75, price: 85, isDefault: false, displayOrder: 3, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
  );

  // Men's Haircut - no variants
  services.push({
    id: uuidv4(),
    salonId: SALON_ID,
    categoryId: hairCatId,
    name: "Men's Haircut",
    description: 'Classic cut with neck cleanup',
    pricingType: 'fixed',
    price: 35,
    duration: 30,
    hasVariants: false,
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
    syncStatus: 'synced',
  });

  // Blowout & Style - with variants
  const blowout: MenuService = {
    id: uuidv4(),
    salonId: SALON_ID,
    categoryId: hairCatId,
    name: 'Blowout & Style',
    description: 'Shampoo and professional blowdry styling',
    pricingType: 'from',
    price: 45,
    duration: 45,
    hasVariants: true,
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
    syncStatus: 'synced',
  };
  services.push(blowout);

  variants.push(
    { id: uuidv4(), salonId: SALON_ID, serviceId: blowout.id, name: 'Short/Medium', duration: 45, price: 45, isDefault: true, displayOrder: 1, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, serviceId: blowout.id, name: 'Long Hair', duration: 60, price: 55, isDefault: false, displayOrder: 2, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, serviceId: blowout.id, name: 'Extra Long', duration: 75, price: 65, isDefault: false, displayOrder: 3, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
  );

  // Deep Conditioning
  services.push({
    id: uuidv4(),
    salonId: SALON_ID,
    categoryId: hairCatId,
    name: 'Deep Conditioning Treatment',
    description: 'Intensive hydration and repair treatment',
    pricingType: 'fixed',
    price: 35,
    duration: 30,
    extraTime: 15,
    extraTimeType: 'processing',
    hasVariants: false,
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
    syncStatus: 'synced',
  });

  // Hair Color (Category 1)
  const colorCatId = categories[1].id;

  const fullColor: MenuService = {
    id: uuidv4(),
    salonId: SALON_ID,
    categoryId: colorCatId,
    name: 'Full Color',
    description: 'Single process all-over color',
    pricingType: 'from',
    price: 95,
    duration: 90,
    extraTime: 30,
    extraTimeType: 'processing',
    hasVariants: true,
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
    syncStatus: 'synced',
  };
  services.push(fullColor);

  variants.push(
    { id: uuidv4(), salonId: SALON_ID, serviceId: fullColor.id, name: 'Short Hair', duration: 90, price: 95, isDefault: true, displayOrder: 1, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, serviceId: fullColor.id, name: 'Medium Hair', duration: 105, price: 115, isDefault: false, displayOrder: 2, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, serviceId: fullColor.id, name: 'Long Hair', duration: 120, price: 135, isDefault: false, displayOrder: 3, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
  );

  // Nail Services (Category 2)
  const nailCatId = categories[2].id;

  services.push(
    {
      id: uuidv4(),
      salonId: SALON_ID,
      categoryId: nailCatId,
      name: 'Classic Manicure',
      description: 'Nail shaping, cuticle care, and polish',
      pricingType: 'fixed',
      price: 28,
      duration: 30,
      hasVariants: false,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      categoryId: nailCatId,
      name: 'Gel Manicure',
      description: 'Long-lasting gel polish manicure',
      pricingType: 'fixed',
      price: 45,
      duration: 45,
      hasVariants: false,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      categoryId: nailCatId,
      name: 'Deluxe Pedicure',
      description: 'Full pedicure with extended massage and mask',
      pricingType: 'fixed',
      price: 55,
      duration: 60,
      hasVariants: false,
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
      syncStatus: 'synced',
    },
  );

  // Spa & Massage (Category 3)
  const spaCatId = categories[3].id;

  const swedishMassage: MenuService = {
    id: uuidv4(),
    salonId: SALON_ID,
    categoryId: spaCatId,
    name: 'Swedish Massage',
    description: 'Classic relaxation massage',
    pricingType: 'from',
    price: 85,
    duration: 60,
    hasVariants: true,
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
    syncStatus: 'synced',
  };
  services.push(swedishMassage);

  variants.push(
    { id: uuidv4(), salonId: SALON_ID, serviceId: swedishMassage.id, name: '60 Minutes', duration: 60, price: 85, isDefault: true, displayOrder: 1, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, serviceId: swedishMassage.id, name: '90 Minutes', duration: 90, price: 125, isDefault: false, displayOrder: 2, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, serviceId: swedishMassage.id, name: '120 Minutes', duration: 120, price: 165, isDefault: false, displayOrder: 3, isActive: true, createdAt: now, updatedAt: now, syncStatus: 'synced' },
  );

  // Facial (Category 4)
  const facialCatId = categories[4].id;

  services.push(
    {
      id: uuidv4(),
      salonId: SALON_ID,
      categoryId: facialCatId,
      name: 'Express Facial',
      description: 'Quick refresh facial treatment',
      pricingType: 'fixed',
      price: 65,
      duration: 30,
      hasVariants: false,
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
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      categoryId: facialCatId,
      name: 'Signature Facial',
      description: 'Full customized facial with extractions',
      pricingType: 'fixed',
      price: 125,
      duration: 75,
      hasVariants: false,
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
      syncStatus: 'synced',
    },
  );

  await db.menuServices.bulkAdd(services);
  console.log(`✅ Seeded ${services.length} menu services`);

  await db.serviceVariants.bulkAdd(variants);
  console.log(`✅ Seeded ${variants.length} service variants`);

  // ==================== PACKAGES ====================
  const packages: ServicePackage[] = [
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Bridal Beauty Package',
      description: 'Complete bridal preparation including hair, makeup, and nails',
      services: [
        { serviceId: services[0].id, serviceName: "Women's Haircut", quantity: 1, originalPrice: 75 },
        { serviceId: services[2].id, serviceName: 'Blowout & Style', quantity: 1, originalPrice: 55 },
        { serviceId: services[6].id, serviceName: 'Gel Manicure', quantity: 1, originalPrice: 45 },
      ],
      originalPrice: 175,
      packagePrice: 149,
      discountType: 'fixed',
      discountValue: 26,
      bookingMode: 'single-session',
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      isActive: true,
      displayOrder: 1,
      color: '#EC4899',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Spa Day Escape',
      description: 'Ultimate relaxation with massage and facial',
      services: [
        { serviceId: services[8].id, serviceName: 'Swedish Massage', quantity: 1, originalPrice: 125 },
        { serviceId: services[10].id, serviceName: 'Signature Facial', quantity: 1, originalPrice: 125 },
      ],
      originalPrice: 250,
      packagePrice: 215,
      discountType: 'percentage',
      discountValue: 14,
      bookingMode: 'single-session',
      validityDays: 90,
      bookingAvailability: 'both',
      onlineBookingEnabled: true,
      isActive: true,
      displayOrder: 2,
      color: '#14B8A6',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      lastModifiedBy: 'system',
      syncStatus: 'synced',
    },
  ];

  await db.servicePackages.bulkAdd(packages);
  console.log(`✅ Seeded ${packages.length} service packages`);

  // ==================== ADD-ON GROUPS & OPTIONS ====================
  const addOnGroups: AddOnGroup[] = [];
  const addOnOptions: AddOnOption[] = [];

  // Hair Add-ons Group
  const hairAddOnsGroup: AddOnGroup = {
    id: uuidv4(),
    salonId: SALON_ID,
    name: 'Hair Enhancements',
    description: 'Additional treatments for hair services',
    selectionMode: 'multiple',
    minSelections: 0,
    maxSelections: 3,
    isRequired: false,
    applicableToAll: false,
    applicableCategoryIds: [categories[0].id, categories[1].id],
    applicableServiceIds: [],
    isActive: true,
    displayOrder: 1,
    onlineBookingEnabled: true,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  };
  addOnGroups.push(hairAddOnsGroup);

  addOnOptions.push(
    { id: uuidv4(), salonId: SALON_ID, groupId: hairAddOnsGroup.id, name: 'Scalp Massage', description: 'Relaxing scalp massage', price: 15, duration: 10, isActive: true, displayOrder: 1, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, groupId: hairAddOnsGroup.id, name: 'Deep Conditioning', description: 'Intensive treatment', price: 25, duration: 15, isActive: true, displayOrder: 2, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, groupId: hairAddOnsGroup.id, name: 'Gloss Treatment', description: 'High-shine gloss', price: 35, duration: 15, isActive: true, displayOrder: 3, createdAt: now, updatedAt: now, syncStatus: 'synced' },
  );

  // Nail Add-ons Group
  const nailAddOnsGroup: AddOnGroup = {
    id: uuidv4(),
    salonId: SALON_ID,
    name: 'Nail Extras',
    description: 'Enhance your nail service',
    selectionMode: 'multiple',
    minSelections: 0,
    maxSelections: 5,
    isRequired: false,
    applicableToAll: false,
    applicableCategoryIds: [categories[2].id],
    applicableServiceIds: [],
    isActive: true,
    displayOrder: 2,
    onlineBookingEnabled: true,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  };
  addOnGroups.push(nailAddOnsGroup);

  addOnOptions.push(
    { id: uuidv4(), salonId: SALON_ID, groupId: nailAddOnsGroup.id, name: 'Paraffin Treatment', description: 'Moisturizing wax', price: 12, duration: 10, isActive: true, displayOrder: 1, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, groupId: nailAddOnsGroup.id, name: 'Nail Art (per nail)', description: 'Custom design', price: 5, duration: 5, isActive: true, displayOrder: 2, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, groupId: nailAddOnsGroup.id, name: 'Gel Removal', description: 'Safe gel polish removal', price: 10, duration: 10, isActive: true, displayOrder: 3, createdAt: now, updatedAt: now, syncStatus: 'synced' },
  );

  // Massage Add-ons Group
  const massageAddOnsGroup: AddOnGroup = {
    id: uuidv4(),
    salonId: SALON_ID,
    name: 'Massage Enhancements',
    description: 'Upgrade your massage experience',
    selectionMode: 'multiple',
    minSelections: 0,
    maxSelections: 2,
    isRequired: false,
    applicableToAll: false,
    applicableCategoryIds: [categories[3].id],
    applicableServiceIds: [],
    isActive: true,
    displayOrder: 3,
    onlineBookingEnabled: true,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
  };
  addOnGroups.push(massageAddOnsGroup);

  addOnOptions.push(
    { id: uuidv4(), salonId: SALON_ID, groupId: massageAddOnsGroup.id, name: 'Hot Stone Enhancement', description: 'Add hot stones', price: 25, duration: 15, isActive: true, displayOrder: 1, createdAt: now, updatedAt: now, syncStatus: 'synced' },
    { id: uuidv4(), salonId: SALON_ID, groupId: massageAddOnsGroup.id, name: 'Aromatherapy', description: 'Essential oil upgrade', price: 15, duration: 0, isActive: true, displayOrder: 2, createdAt: now, updatedAt: now, syncStatus: 'synced' },
  );

  await db.addOnGroups.bulkAdd(addOnGroups);
  console.log(`✅ Seeded ${addOnGroups.length} add-on groups`);

  await db.addOnOptions.bulkAdd(addOnOptions);
  console.log(`✅ Seeded ${addOnOptions.length} add-on options`);

  // ==================== CATALOG SETTINGS ====================
  const settings: CatalogSettings = {
    id: uuidv4(),
    salonId: SALON_ID,
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
export async function needsCatalogSeed(salonId: string = SALON_ID): Promise<boolean> {
  const categoryCount = await db.serviceCategories.where('salonId').equals(salonId).count();
  return categoryCount === 0;
}

// ==================== MIGRATION ====================

/**
 * Migrate data from old `services` table to new catalog tables.
 * This handles the transition from the legacy Service type to MenuService + ServiceVariants.
 *
 * @param salonId - The salon to migrate
 * @returns Migration result with counts
 */
export async function migrateServicesToCatalog(salonId: string): Promise<{
  migrated: number;
  categoriesCreated: number;
  skipped: number;
}> {
  console.log('🔄 Starting services to catalog migration...');

  // Get existing legacy services
  const legacyServices = await db.services.where('salonId').equals(salonId).toArray();

  if (legacyServices.length === 0) {
    console.log('ℹ️ No legacy services to migrate');
    return { migrated: 0, categoriesCreated: 0, skipped: 0 };
  }

  // Check if already migrated (if menuServices has data for this salon)
  const existingMenuServices = await db.menuServices.where('salonId').equals(salonId).count();
  if (existingMenuServices > 0) {
    console.log('ℹ️ Catalog already has data, skipping migration');
    return { migrated: 0, categoriesCreated: 0, skipped: legacyServices.length };
  }

  const now = new Date();
  let migrated = 0;
  let categoriesCreated = 0;
  const categoryMap = new Map<string, string>(); // category name -> category ID

  // First, create categories from unique category names
  const uniqueCategories = [...new Set(legacyServices.map(s => s.category).filter(Boolean))];

  for (let i = 0; i < uniqueCategories.length; i++) {
    const catName = uniqueCategories[i];
    const categoryId = uuidv4();
    categoryMap.set(catName, categoryId);

    const category: ServiceCategory = {
      id: categoryId,
      salonId,
      name: catName,
      description: '',
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      displayOrder: i + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: 'migration',
      lastModifiedBy: 'migration',
      syncStatus: 'local',
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
      salonId,
      categoryId,
      name: legacyService.name,
      description: legacyService.description || '',
      pricingType: 'fixed',
      price: legacyService.price,
      duration: legacyService.duration,
      hasVariants: false,
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
      syncStatus: 'local',
    };

    await db.menuServices.add(menuService);
    migrated++;
  }

  console.log(`✅ Migrated ${migrated} services to catalog`);

  // Create default catalog settings if not exists
  const existingSettings = await db.catalogSettings.where('salonId').equals(salonId).first();
  if (!existingSettings) {
    await db.catalogSettings.add({
      id: uuidv4(),
      salonId,
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
 * @param salonId - The salon to initialize
 * @param seedIfEmpty - Whether to seed sample data if no services exist
 */
export async function initializeCatalog(
  salonId: string,
  seedIfEmpty: boolean = false
): Promise<{
  action: 'migrated' | 'seeded' | 'existing' | 'empty';
  details?: any;
}> {
  // Check for existing catalog data
  const existingCategories = await db.serviceCategories.where('salonId').equals(salonId).count();
  const existingServices = await db.menuServices.where('salonId').equals(salonId).count();

  if (existingCategories > 0 || existingServices > 0) {
    console.log('ℹ️ Catalog already initialized');
    return { action: 'existing', details: { categories: existingCategories, services: existingServices } };
  }

  // Check for legacy services to migrate
  const legacyServices = await db.services.where('salonId').equals(salonId).count();

  if (legacyServices > 0) {
    const result = await migrateServicesToCatalog(salonId);
    return { action: 'migrated', details: result };
  }

  // No data exists - optionally seed
  if (seedIfEmpty) {
    const result = await seedCatalog();
    return { action: 'seeded', details: result };
  }

  return { action: 'empty' };
}
