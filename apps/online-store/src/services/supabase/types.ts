/**
 * Supabase Database Types for Mango Online Store
 *
 * Re-exports types from @mango/supabase and adds Online Store specific types.
 */

// Re-export all types from the shared package
export type {
  Database,
  Json,
  // Core business types
  ClientRow,
  StaffRow,
  ServiceRow,
  AppointmentRow,
  StoreRow,
  // Enums
  StaffRole,
} from '@mango/supabase';

// Import for local use
import type { Database as BaseDatabase, Json } from '@mango/supabase';

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
 * Client authentication record linking Supabase Auth to POS clients
 */
export interface ClientAuthRow {
  id: string;
  auth_user_id: string;
  client_id: string | null;
  store_id: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  link_method: 'email_match' | 'phone_verify' | 'manual' | 'oauth';
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Online booking request from website/app
 */
export interface OnlineBookingRow {
  id: string;
  store_id: string;
  client_id: string | null;
  service_id: string;
  staff_id: string | null;
  requested_date: string;
  requested_time: string;
  status: OnlineBookingStatus;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  appointment_id: string | null;
  notes: string | null;
  source: BookingSource;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
}

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
 * E-commerce order
 */
export interface OrderRow {
  id: string;
  store_id: string;
  client_id: string | null;
  order_number: string;
  status: OrderStatus;
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
// EXTENDED DATABASE TYPE (With Online Store tables)
// ============================================================================

/**
 * Extended Database interface including Online Store tables
 * This will be updated as migrations are created
 */
export interface OnlineStoreDatabase extends BaseDatabase {
  public: BaseDatabase['public'] & {
    Tables: BaseDatabase['public']['Tables'] & {
      // Future tables will be added here after migrations
      // client_auth: { Row: ClientAuthRow; Insert: ...; Update: ... };
      // online_bookings: { Row: OnlineBookingRow; Insert: ...; Update: ... };
      // etc.
    };
  };
}

// For now, use the base Database type until migrations are run
export type Database = BaseDatabase;

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
