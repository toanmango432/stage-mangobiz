export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number; // minutes
  basePrice: number;
  price: number; // For booking flow compatibility
  showOnline: boolean;
  image?: string;
  gallery?: string[];
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
  requiresPatchTest?: boolean; // Services like hair coloring may require patch test
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

export interface Membership {
  id: string;
  name: string;
  description: string;
  featured: boolean;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  trialDays: number;
  setupFee?: number;
  benefits: {
    serviceDiscountPercent: number;
    productDiscountPercent: number;
    priorityBooking: boolean;
    complimentaryServices: string[];
    otherPerks: string[];
  };
  autoRenewal: boolean;
  gracePeriodDays: number;
  cancellationPolicy: 'immediate' | 'end-of-cycle' | 'with-penalty';
  pauseAllowed: boolean;
  showOnline: boolean;
  availableForPurchase: boolean;
  activeMembersCount: number;
  createdAt: string;
  updatedAt: string;
}

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
