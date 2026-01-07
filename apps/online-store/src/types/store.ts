// Unified store types - stable contract for all data

export interface SalonInfo {
  name: string;
  logoUrl?: string;
  tagline?: string;
  description?: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    website?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ReviewUI {
  id: string;
  clientName: string;
  rating: number; // 1..5
  comment: string;
  dateISO: string;
  serviceId?: string;
  serviceName?: string;
  staffId?: string;
  staffName?: string;
  verified?: boolean;
}

export interface ReviewAggregate {
  count: number;
  avg: number;
}

export interface ReviewsResponse {
  reviews: ReviewUI[];
  aggregate: ReviewAggregate;
  nextOffset?: number;
}

export interface ReviewFilters {
  limit?: number;
  offset?: number;
  serviceId?: string;
  staffId?: string;
  minRating?: number;
}

export interface GalleryItem {
  id: string;
  url: string;
  thumbUrl?: string;
  caption: string;
  tags: string[];
  dateISO?: string;
  staffId?: string;
  staffName?: string;
  serviceId?: string;
  serviceName?: string;
}

export interface GalleryResponse {
  items: GalleryItem[];
  nextOffset?: number;
}

export interface GalleryFilters {
  limit?: number;
  offset?: number;
  tag?: string;
  serviceId?: string;
  staffId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  specialties: string[];
  rating?: number;
  bioShort?: string;
  bio?: string;
  experience?: string;
}

export interface StoreService {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  galleryImages?: string[];
}

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAt?: number;
  stock: number;
  category?: string;
  tags?: string[];
  images: string[];
  brand?: string;
}

export interface GiftCardDesign {
  id: string;
  name: string;
  previewUrl: string;
  description: string;
  colors?: {
    primary: string;
    secondary: string;
  };
}

export interface GiftCardConfig {
  enabled: boolean;
  presetAmounts: number[];
  customAmountMin: number;
  customAmountMax: number;
  expiryMonths: number | null;
  deliveryMethods: ('instant' | 'scheduled')[];
  allowMessage: boolean;
  maxMessageLength: number;
}

export interface MembershipPlan {
  id: string;
  name: string;
  displayName?: string;
  priceMonthly: number;
  description: string;
  tagline?: string;
  imageUrl?: string;
  color?: string;
  perks: string[];
  benefits?: string[];
  features?: {
    servicesDiscount: number;
    productsDiscount: number;
    priorityBooking: 'standard' | 'priority' | 'vip';
    freeServicesMonthly: number;
    birthdayGift: boolean | 'premium';
    exclusiveEvents: boolean;
    concierge: boolean;
  };
  rules?: {
    discountPctServices?: number;
    discountPctProducts?: number;
    freeServiceIds?: string[];
  };
  popular?: boolean;
}

export interface PolicyContent {
  title: string;
  lastUpdated: string;
  content: string;
}

export interface Policies {
  privacy: PolicyContent;
  terms: PolicyContent;
  refund: PolicyContent;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FAQResponse {
  items: FAQItem[];
}

export interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  dateISO: string;
  link?: string;
}

export interface NavConfig {
  showInfoInNav: boolean;
  infoPagesOrder: string[];
  promoteInfoToPrimary: {
    [key: string]: boolean;
  };
}

// Client & Account types
export interface Client {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  marketingConsent?: {
    email?: boolean;
    sms?: boolean;
    updatedAt?: string;
  };
  notificationPrefs?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  addresses?: Address[];
  points?: number;
  membershipId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface ClientPublic {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  membershipId?: string;
  points?: number;
}

// Cart & Session types
export interface Session {
  id: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  type: 'service' | 'product' | 'membership' | 'giftcard';
  refId: string;
  qty: number;
  price: number;
  meta?: Record<string, unknown>;
}

export interface Cart {
  id: string;
  sessionId: string;
  items: CartItem[];
  currency?: string;
  updatedAt: string;
}

// Booking types
export interface Booking {
  id: string;
  clientId?: string;
  serviceId: string;
  providerId?: string;
  slotStartISO: string;
  slotEndISO: string;
  status: 'draft' | 'confirmed' | 'canceled' | 'completed';
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  name: string;
  skills?: string[];
  rating?: number;
  avatarUrl?: string;
}

export interface Slot {
  id: string;
  providerId?: string;
  startISO: string;
  endISO: string;
  capacity?: number;
  available: boolean;
}

// Order types
export interface Order {
  id: string;
  clientId?: string;
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  discounts?: number;
  taxes?: number;
  total: number;
  currency?: string;
  status: 'paid' | 'refunded' | 'voided';
  createdAt: string;
  updatedAt: string;
}


export interface GiftCardPurchase {
  id: string;
  orderId: string;
  amount: number;
  designId: string;
  recipientName?: string;
  recipientEmail?: string;
  scheduleISO?: string;
  code?: string;
}

// Account aggregates
export interface AccountSummary {
  client: ClientPublic;
  orders: Array<Pick<Order, 'id' | 'total' | 'status' | 'createdAt'>>;
  bookings: Array<Pick<Booking, 'id' | 'serviceId' | 'slotStartISO' | 'status'>>;
  membership?: MembershipPlan;
}
