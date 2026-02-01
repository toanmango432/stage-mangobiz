/**
 * Supabase Database Types for Mango Online Store
 *
 * Local type definitions for Online Store use.
 * These types mirror the main @mango/supabase types but are self-contained
 * to avoid monorepo dependency issues during typecheck.
 */

// Define Json type locally
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// STAFF ROLE TYPE
// ============================================================================

export type StaffRole =
  | 'owner'
  | 'manager'
  | 'senior_stylist'
  | 'stylist'
  | 'junior_stylist'
  | 'apprentice'
  | 'barber'
  | 'colorist'
  | 'nail_technician'
  | 'esthetician'
  | 'massage_therapist'
  | 'makeup_artist'
  | 'receptionist'
  | 'assistant';

// ============================================================================
// ROW TYPES - All row types must be defined BEFORE Database interface
// ============================================================================

// Online booking row
export interface OnlineBookingRow {
  id: string;
  store_id: string;
  client_id: string | null;
  service_id: string;
  staff_id: string | null;
  requested_date: string;
  requested_time: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  appointment_id: string | null;
  notes: string | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
}

// Cart row
export interface CartRow {
  id: string;
  session_id: string;
  store_id: string | null;
  client_id: string | null;
  items: Json;
  updated_at: string;
  created_at: string;
}

// Order row
export interface OrderRow {
  id: string;
  store_id: string;
  client_id: string | null;
  order_number: string;
  status: string;
  items: Json;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  payment_status: string;
  payment_method: string | null;
  shipping_address: Json | null;
  billing_address: Json | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Service category row
export interface ServiceCategoryRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Client auth row (for online store auth)
export interface ClientAuthRow {
  id: string;
  auth_user_id: string;
  client_id: string | null;
  store_id: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  link_method: string | null;
  link_token: string | null;
  link_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Core row types
export interface ClientRow {
  id: string;
  store_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  is_blocked: boolean;
  is_vip: boolean;
  preferences: Json;
  loyalty_info: Json;
  visit_summary: Json;
  tags: Json;
  notes: Json;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

export interface StaffRow {
  id: string;
  store_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  is_active: boolean;
  schedule: Json;
  role: StaffRole;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  store_id: string;
  name: string;
  category: string | null;
  duration: number;
  price: number;
  is_active: boolean;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRow {
  id: string;
  store_id: string;
  client_id: string | null;
  client_name: string;
  staff_id: string | null;
  services: Json;
  status: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  notes: string | null;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

export interface StoreRow {
  id: string;
  license_id: string;
  tenant_id: string;
  name: string;
  store_login_id: string;
  password_hash: string;
  store_email: string | null;
  address: string | null;
  phone: string | null;
  timezone: string | null;
  status: string;
  settings: Json | null;
  device_policy: Json | null;
  last_login_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

// Online cart for shopping
export interface OnlineCartRow {
  id: string;
  session_id: string;
  store_id: string | null;
  client_id: string | null;
  items: Json;
  updated_at: string;
  created_at: string;
}

// Online order
export interface OnlineOrderRow {
  id: string;
  store_id: string;
  client_id: string | null;
  order_number: string;
  status: string;
  items: Json;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  payment_status: string;
  payment_method: string | null;
  shipping_address: Json | null;
  billing_address: Json | null;
  notes: string | null;
  cart_id: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  promo_code: string | null;
  pickup_location: string | null;
  pickup_time: string | null;
  created_at: string;
  updated_at: string;
}

// Store-staff association
export interface StoreStaffRow {
  id: string;
  store_id: string;
  staff_id: string;
  is_primary: boolean;
  created_at: string;
}

// ============================================================================
// INSERT/UPDATE TYPES
// For Supabase to properly infer types, Insert types need to match Row minus auto-generated fields
// Update types are Partial versions of Insert
// ============================================================================

// Online cart insert/update types
export type OnlineCartInsert = {
  id?: string;
  session_id?: string;
  store_id?: string | null;
  client_id?: string | null;
  items?: Json;
  updated_at?: string;
  created_at?: string;
};

export type OnlineCartUpdate = Partial<OnlineCartInsert>;

// Online order insert/update types
export type OnlineOrderInsert = {
  id?: string;
  store_id: string;
  client_id?: string | null;
  order_number: string;
  status?: string;
  items?: Json;
  subtotal?: number;
  discount?: number;
  tax?: number;
  shipping?: number;
  total?: number;
  payment_status?: string;
  payment_method?: string | null;
  shipping_address?: Json | null;
  billing_address?: Json | null;
  notes?: string | null;
  cart_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  promo_code?: string | null;
  pickup_location?: string | null;
  pickup_time?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type OnlineOrderUpdate = Partial<OnlineOrderInsert>;

// Client auth insert/update types
export type ClientAuthInsert = {
  id?: string;
  auth_user_id: string;
  client_id?: string | null;
  store_id: string;
  email: string;
  phone?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  link_method?: string | null;
  link_token?: string | null;
  link_token_expires_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ClientAuthUpdate = {
  client_id?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  link_method?: string | null;
  link_token?: string | null;
  link_token_expires_at?: string | null;
  updated_at?: string;
};

// Online booking insert/update types
export type OnlineBookingInsert = {
  id?: string;
  store_id: string;
  client_id?: string | null;
  service_id: string;
  staff_id?: string | null;
  requested_date: string;
  requested_time: string;
  status?: string;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  appointment_id?: string | null;
  notes?: string | null;
  source?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type OnlineBookingUpdate = Partial<OnlineBookingInsert>;

// ============================================================================
// DATABASE INTERFACE
// Using simplified types that work with Supabase v2 @supabase/ssr
// All fields optional for Insert/Update to allow flexible CRUD operations
// ============================================================================

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: ClientRow;
        Insert: Partial<ClientRow>;
        Update: Partial<ClientRow>;
      };
      staff: {
        Row: StaffRow;
        Insert: Partial<StaffRow>;
        Update: Partial<StaffRow>;
      };
      services: {
        Row: ServiceRow;
        Insert: Partial<ServiceRow>;
        Update: Partial<ServiceRow>;
      };
      appointments: {
        Row: AppointmentRow;
        Insert: Partial<AppointmentRow>;
        Update: Partial<AppointmentRow>;
      };
      stores: {
        Row: StoreRow;
        Insert: Partial<StoreRow>;
        Update: Partial<StoreRow>;
      };
      online_bookings: {
        Row: OnlineBookingRow;
        Insert: OnlineBookingInsert;
        Update: OnlineBookingUpdate;
      };
      carts: {
        Row: CartRow;
        Insert: Partial<CartRow>;
        Update: Partial<CartRow>;
      };
      orders: {
        Row: OrderRow;
        Insert: Partial<OrderRow>;
        Update: Partial<OrderRow>;
      };
      service_categories: {
        Row: ServiceCategoryRow;
        Insert: Partial<ServiceCategoryRow>;
        Update: Partial<ServiceCategoryRow>;
      };
      client_auth: {
        Row: ClientAuthRow;
        Insert: ClientAuthInsert;
        Update: ClientAuthUpdate;
      };
      online_carts: {
        Row: OnlineCartRow;
        Insert: OnlineCartInsert;
        Update: OnlineCartUpdate;
      };
      online_orders: {
        Row: OnlineOrderRow;
        Insert: OnlineOrderInsert;
        Update: OnlineOrderUpdate;
      };
      store_staff: {
        Row: StoreStaffRow;
        Insert: Partial<StoreStaffRow>;
        Update: Partial<StoreStaffRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ============================================================================
// ONLINE STORE SPECIFIC TYPES (Future migrations 015+)
// ============================================================================

/**
 * Online booking status
 */
export type OnlineBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

/**
 * Online booking source
 */
export type BookingSource = 'web' | 'ios' | 'android' | 'google' | 'facebook' | 'api';

/**
 * Gift card status
 */
export type GiftCardStatus = 'active' | 'used' | 'expired' | 'cancelled';

/**
 * Order status
 */
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

/**
 * Review status
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

/**
 * Membership status
 */
export type MembershipStatus = 'active' | 'paused' | 'cancelled' | 'expired';

// ============================================================================
// ONLINE STORE TABLE TYPES (Planned - migrations 015-026)
// ============================================================================

/**
 * Gift card definition
 */
export interface GiftCardRow {
  id: string;
  store_id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  status: GiftCardStatus;
  purchased_by: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  message: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Client's purchased gift card
 */
export interface ClientGiftCardRow {
  id: string;
  client_id: string;
  gift_card_id: string;
  store_id: string;
  balance: number;
  status: GiftCardStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Membership plan
 */
export interface MembershipRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  billing_period: 'monthly' | 'quarterly' | 'yearly';
  benefits: Json;
  discount_percentage: number | null;
  included_services: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Client's active membership
 */
export interface ClientMembershipRow {
  id: string;
  client_id: string;
  membership_id: string;
  store_id: string;
  status: MembershipStatus;
  started_at: string;
  next_billing_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Product for e-commerce
 */
export interface ProductRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  images: string[];
  is_active: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Service/Staff review
 */
export interface ReviewRow {
  id: string;
  store_id: string;
  client_id: string | null;
  staff_id: string | null;
  service_id: string | null;
  appointment_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  photos: string[] | null;
  status: ReviewStatus;
  verified_purchase: boolean;
  helpful_count: number;
  response_text: string | null;
  response_by: string | null;
  response_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Promotion/Discount
 */
export interface PromotionRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  code: string | null;
  type: 'percentage' | 'fixed' | 'free_service' | 'bundle';
  value: number;
  min_purchase: number | null;
  max_discount: number | null;
  applies_to: 'all' | 'services' | 'products' | 'specific';
  applicable_items: string[] | null;
  start_date: string;
  end_date: string | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

/**
 * API error format
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// PUBLIC FACING TYPES (For Online Store UI)
// ============================================================================

/**
 * Public service info for booking
 */
export interface PublicService {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  images?: string[];
}

/**
 * Public staff profile
 */
export interface PublicStaff {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
}

/**
 * Available time slot
 */
export interface TimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
  staffName?: string;
}

/**
 * Store public info
 */
export interface PublicStoreInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: Record<string, string>;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
