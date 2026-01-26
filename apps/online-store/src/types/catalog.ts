export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number; // minutes
  basePrice: number;
  price: number; // For booking flow compatibility
  showOnline: boolean;
  showPriceOnline: boolean; // Control price visibility online
  image?: string;
  gallery?: string[];
  hasVariants: boolean; // Service has multiple variants
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    duration?: number;
    isDefault?: boolean;
  }>;
  addOns: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  questions?: Array<{
    id: string;
    question: string;
    type: 'yes_no' | 'radio' | 'checkbox';
    required: boolean;
    options: Array<{
      label: string;
      value: string;
      priceModifier: number;
    }>;
  }>;
  tags: string[];
  requiresDeposit: boolean;
  depositAmount?: number;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  createdAt: string;
  updatedAt: string;
  // Promotional fields
  imageUrl?: string;
  featured?: boolean;
  badge?: 'POPULAR' | 'NEW' | 'LIMITED' | 'SEASONAL';
  rating?: number;
  reviewCount?: number;
  bookingCount?: number;
  benefits?: string[];
  compareAtPrice?: number;
  tagline?: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  type: 'prepaid-sessions' | 'bundle-deal';
  services: Array<{
    serviceId: string;
    serviceName: string;
    quantity: number;
  }>;
  regularPrice: number;
  packagePrice: number;
  savingsPercent: number;
  expiryDays: number | null;
  shareable: boolean;
  refundable: boolean;
  showOnline: boolean;
  featured: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  vendor?: string;
  category: string;
  description: string;
  costPrice: number;
  retailPrice: number;
  compareAtPrice?: number;
  taxable: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorders: boolean;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price?: number;
    stockQuantity: number;
  }>;
  images: string[];
  requiresShipping: boolean;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  collections: string[];
  tags: string[];
  showOnline: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Typed interfaces for MembershipPlan JSONB fields.
 * These replace Record<string, any> for type safety.
 */
export interface MembershipFeatures {
  discountPercentage?: number;
  complimentaryServices?: number;
  priorityBooking?: boolean;
  freeProductSamples?: boolean;
  vipLoungeAccess?: boolean;
  unlimitedServices?: boolean;
  exclusiveEvents?: boolean;
  personalConcierge?: boolean;
  [key: string]: unknown;
}

export interface MembershipRules {
  minCommitmentMonths?: number;
  cancellationNoticeDays?: number;
  [key: string]: unknown;
}

/**
 * Canonical membership plan type — matches Supabase membership_plans table
 * and the Online Store admin UI (Memberships.tsx).
 *
 * Replaces the old Membership interface (e-commerce subscription model)
 * and the MembershipPlan interface from membershipStorage.ts.
 */
export interface MembershipPlan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  description: string;
  tagline: string;
  imageUrl: string;
  badgeIcon: string;
  color: string;
  perks: string[];
  features: MembershipFeatures;
  rules: MembershipRules;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * @deprecated Use MembershipPlan instead. This type is kept for backward compatibility
 * with code that hasn't been migrated yet.
 */
export type Membership = MembershipPlan;

export interface GiftCardConfig {
  enabled: boolean;
  presetAmounts: number[];
  allowCustomAmounts: boolean;
  customAmountMin: number;
  customAmountMax: number;
  expiryMonths: number | null;
  designs: Array<{
    id: string;
    name: string;
    imageUrl: string;
    isDefault: boolean;
  }>;
  deliveryOptions: {
    digital: boolean;
    physical: boolean;
    messageCharLimit: number;
  };
  terms: string;
  emailTemplate: {
    subject: string;
    body: string;
  };
}

export interface GiftCard {
  id: string;
  code: string;
  originalAmount: number;
  balance: number;
  recipientEmail: string;
  recipientName: string;
  message?: string;
  status: 'active' | 'partially-used' | 'redeemed' | 'expired';
  issuedDate: string;
  expiryDate?: string;
}
