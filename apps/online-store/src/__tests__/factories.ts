/**
 * Test Factory Functions for Online Store
 *
 * Creates mock objects that satisfy type interfaces for testing.
 * Use these factories instead of inline object literals in tests.
 */

import type { Service, Staff, Package, Product, GiftCard, MembershipPlan } from '@/types/catalog';

// ============================================================================
// Service Factory
// ============================================================================

export interface CreateMockServiceOptions {
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  duration?: number;
  basePrice?: number;
  price?: number;
  showOnline?: boolean;
  showPriceOnline?: boolean;
  image?: string;
  hasVariants?: boolean;
  featured?: boolean;
  isPopular?: boolean;
  badge?: 'POPULAR' | 'NEW' | 'LIMITED' | 'SEASONAL';
  rating?: number;
  reviewCount?: number;
}

export function createMockService(options: CreateMockServiceOptions = {}): Service {
  const basePrice = options.basePrice ?? 45;
  return {
    id: options.id ?? '1',
    name: options.name ?? 'Gel Manicure',
    category: options.category ?? 'Nail Services',
    description: options.description ?? 'Premium gel manicure service',
    duration: options.duration ?? 60,
    basePrice,
    price: options.price ?? basePrice,
    showOnline: options.showOnline ?? true,
    showPriceOnline: options.showPriceOnline ?? true,
    image: options.image ?? '/images/gel-manicure.jpg',
    hasVariants: options.hasVariants ?? false,
    addOns: [],
    tags: [],
    requiresDeposit: false,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    featured: options.featured,
    isPopular: options.isPopular,
    badge: options.badge,
    rating: options.rating,
    reviewCount: options.reviewCount,
  };
}

// ============================================================================
// Staff Factory
// ============================================================================

export interface CreateMockStaffOptions {
  id?: string;
  name?: string;
  avatar?: string;
  title?: string;
  role?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
  isAvailable?: boolean;
  services?: string[];
  portfolio?: string[];
  experienceYears?: number;
  availability?: Record<string, { start: string; end: string }[]>;
}

export function createMockStaff(options: CreateMockStaffOptions = {}): Staff {
  return {
    id: options.id ?? '1',
    name: options.name ?? 'Sarah Chen',
    avatar: options.avatar ?? '/images/sarah-chen.jpg',
    title: options.title ?? 'Senior Stylist',
    role: options.role ?? 'Stylist',
    bio: options.bio ?? 'Expert colorist with 8 years of experience',
    specialties: options.specialties ?? ['Hair Color', 'Balayage', 'Haircuts'],
    rating: options.rating ?? 4.9,
    reviewCount: options.reviewCount ?? 127,
    isAvailable: options.isAvailable ?? true,
    services: options.services ?? [],
    portfolio: options.portfolio ?? [],
    experienceYears: options.experienceYears ?? 8,
    availability: options.availability ?? {
      monday: [{ start: '09:00', end: '18:00' }],
      tuesday: [{ start: '09:00', end: '18:00' }],
      wednesday: [{ start: '09:00', end: '18:00' }],
      thursday: [{ start: '09:00', end: '18:00' }],
      friday: [{ start: '09:00', end: '18:00' }],
      saturday: [{ start: '10:00', end: '16:00' }],
      sunday: [{ start: '10:00', end: '16:00' }],
    },
  };
}

// ============================================================================
// Package Factory
// ============================================================================

export interface CreateMockPackageOptions {
  id?: string;
  name?: string;
  description?: string;
  type?: 'prepaid-sessions' | 'bundle-deal';
  services?: Array<{ serviceId: string; serviceName: string; quantity: number }>;
  regularPrice?: number;
  packagePrice?: number;
  savingsPercent?: number;
  showOnline?: boolean;
  featured?: boolean;
}

export function createMockPackage(options: CreateMockPackageOptions = {}): Package {
  return {
    id: options.id ?? '1',
    name: options.name ?? 'Manicure 5-Pack',
    description: options.description ?? 'Save 20% with a 5-session manicure package',
    type: options.type ?? 'prepaid-sessions',
    services: options.services ?? [
      { serviceId: '1', serviceName: 'Gel Manicure', quantity: 5 },
    ],
    regularPrice: options.regularPrice ?? 225,
    packagePrice: options.packagePrice ?? 180,
    savingsPercent: options.savingsPercent ?? 20,
    expiryDays: 365,
    shareable: false,
    refundable: false,
    showOnline: options.showOnline ?? true,
    featured: options.featured ?? false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

// ============================================================================
// Product Factory
// ============================================================================

export interface CreateMockProductOptions {
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  retailPrice?: number;
  stockQuantity?: number;
  showOnline?: boolean;
  featured?: boolean;
}

export function createMockProduct(options: CreateMockProductOptions = {}): Product {
  return {
    id: options.id ?? '1',
    name: options.name ?? 'OPI Nail Polish',
    sku: options.sku ?? 'OPI-001',
    category: options.category ?? 'Nail Care',
    description: options.description ?? 'Professional nail polish',
    costPrice: 8,
    retailPrice: options.retailPrice ?? 15,
    taxable: true,
    trackInventory: true,
    stockQuantity: options.stockQuantity ?? 50,
    lowStockThreshold: 10,
    allowBackorders: false,
    images: [],
    requiresShipping: true,
    collections: [],
    tags: [],
    showOnline: options.showOnline ?? true,
    featured: options.featured ?? false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

// ============================================================================
// Gift Card Factory
// ============================================================================

export interface CreateMockGiftCardOptions {
  id?: string;
  code?: string;
  originalAmount?: number;
  balance?: number;
  status?: 'active' | 'partially-used' | 'redeemed' | 'expired';
  recipientEmail?: string;
  recipientName?: string;
}

export function createMockGiftCard(options: CreateMockGiftCardOptions = {}): GiftCard {
  return {
    id: options.id ?? '1',
    code: options.code ?? 'GC-ABC123',
    originalAmount: options.originalAmount ?? 100,
    balance: options.balance ?? 100,
    recipientEmail: options.recipientEmail ?? 'recipient@example.com',
    recipientName: options.recipientName ?? 'Jane Doe',
    status: options.status ?? 'active',
    issuedDate: '2024-01-01T00:00:00Z',
  };
}

// ============================================================================
// Membership Factory
// ============================================================================

export interface CreateMockMembershipOptions {
  id?: string;
  name?: string;
  displayName?: string;
  priceMonthly?: number;
  description?: string;
  tagline?: string;
  perks?: string[];
  isPopular?: boolean;
  isActive?: boolean;
}

export function createMockMembership(options: CreateMockMembershipOptions = {}): MembershipPlan {
  return {
    id: options.id ?? '1',
    name: options.name ?? 'gold',
    displayName: options.displayName ?? 'Gold Membership',
    priceMonthly: options.priceMonthly ?? 49,
    description: options.description ?? 'Premium membership with exclusive benefits',
    tagline: options.tagline ?? 'The perfect choice for regulars',
    imageUrl: '/images/gold-membership.jpg',
    badgeIcon: 'star',
    color: '#FFD700',
    perks: options.perks ?? ['10% off services', 'Priority booking', 'Free products'],
    features: { discountPercentage: 10, priorityBooking: true },
    rules: { minCommitmentMonths: 3 },
    isPopular: options.isPopular ?? false,
    isActive: options.isActive ?? true,
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

// ============================================================================
// Booking Data Factory (for mock services)
// ============================================================================

export interface MockBookingServiceData {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  basePrice: number;
  image?: string | null;
  featured?: boolean;
  popular?: boolean;
}

export function createMockBookingServiceData(
  options: Partial<MockBookingServiceData> = {}
): MockBookingServiceData {
  return {
    id: options.id ?? '1',
    name: options.name ?? 'Gel Manicure',
    category: options.category ?? 'Nail Services',
    description: options.description ?? 'Premium gel manicure service',
    duration: options.duration ?? 60,
    basePrice: options.basePrice ?? 45,
    image: options.image ?? '/images/gel-manicure.jpg',
    featured: options.featured ?? false,
    popular: options.popular ?? false,
  };
}

// ============================================================================
// Staff Personality Card Data Factory
// ============================================================================

export interface StaffPersonalityData {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  experience: number;
  totalBookings: number;
  avatar: string | null;
  portfolio: string[];
  bio: string;
  workingHours: Record<string, { start: string; end: string }>;
  daysOff: string[];
  availability?: 'available' | 'busy' | 'offline';
}

export function createMockStaffPersonality(
  options: Partial<StaffPersonalityData> = {}
): StaffPersonalityData {
  return {
    id: options.id ?? '1',
    name: options.name ?? 'Sarah Chen',
    role: options.role ?? 'Senior Stylist',
    specialties: options.specialties ?? ['Hair Color', 'Balayage', 'Haircuts'],
    rating: options.rating ?? 4.9,
    reviewCount: options.reviewCount ?? 127,
    experience: options.experience ?? 8,
    totalBookings: options.totalBookings ?? 1250,
    avatar: options.avatar ?? '/images/sarah-chen.jpg',
    portfolio: options.portfolio ?? [
      '/images/portfolio/sarah-1.jpg',
      '/images/portfolio/sarah-2.jpg',
      '/images/portfolio/sarah-3.jpg',
      '/images/portfolio/sarah-4.jpg',
    ],
    bio: options.bio ?? 'Expert colorist with 8 years of experience',
    workingHours: options.workingHours ?? {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: { start: '10:00', end: '16:00' },
    },
    daysOff: options.daysOff ?? [],
    availability: options.availability,
  };
}

// ============================================================================
// Store Factory
// ============================================================================

export interface MockStore {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  timezone: string;
  businessHours: Record<string, { open: string; close: string; closed?: boolean }>;
}

export function createMockStore(options: Partial<MockStore> = {}): MockStore {
  return {
    id: options.id ?? 'store-1',
    name: options.name ?? 'Luxe Nail Spa',
    address: options.address ?? '123 Main Street',
    city: options.city ?? 'Los Angeles',
    state: options.state ?? 'CA',
    zip: options.zip ?? '90001',
    phone: options.phone ?? '(555) 123-4567',
    email: options.email ?? 'info@luxenailspa.com',
    timezone: options.timezone ?? 'America/Los_Angeles',
    businessHours: options.businessHours ?? {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '10:00', close: '16:00', closed: true },
    },
  };
}

// ============================================================================
// Booking Factory (for display mode)
// ============================================================================

export interface MockBooking {
  id: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  date: string;
  time: string;
  serviceName: string;
  staffName?: string;
  duration: number;
  price: number;
}

export function createMockBooking(options: Partial<MockBooking> = {}): MockBooking {
  return {
    id: options.id ?? 'booking-1',
    status: options.status ?? 'confirmed',
    date: options.date ?? '2024-01-15',
    time: options.time ?? '14:00',
    serviceName: options.serviceName ?? 'Gel Manicure',
    staffName: options.staffName ?? 'Sarah Chen',
    duration: options.duration ?? 60,
    price: options.price ?? 45,
  };
}

// ============================================================================
// Cart Item Factory
// ============================================================================

export interface MockCartItem {
  id: string;
  type: 'service' | 'product' | 'gift-card' | 'membership';
  name: string;
  price: number;
  quantity: number;
  serviceDetails?: {
    staffId?: string;
    staffName?: string;
    date?: string;
    time?: string;
    duration?: number;
  };
}

export function createMockCartItem(options: Partial<MockCartItem> = {}): MockCartItem {
  return {
    id: options.id ?? 'item-1',
    type: options.type ?? 'service',
    name: options.name ?? 'Gel Manicure',
    price: options.price ?? 45,
    quantity: options.quantity ?? 1,
    serviceDetails: options.serviceDetails,
  };
}
