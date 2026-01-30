/**
 * Supabase Services for Mango Online Store
 *
 * Provides database access to the main POS database.
 */

// Client and utilities
export {
  supabase,
  isCircuitOpen,
  recordSuccess,
  recordFailure,
  getCircuitStatus,
  withCircuitBreaker,
  createStoreQuery,
} from './client';

// Types
export type {
  Database,
  Json,
  ClientRow,
  StaffRow,
  ServiceRow,
  AppointmentRow,
  StoreRow,
  // Online Store types
  OnlineBookingRow,
  GiftCardRow,
  MembershipRow,
  ProductRow,
  OrderRow,
  ReviewRow,
  PromotionRow,
  ClientAuthRow,
  // API types
  ApiResponse,
  ApiError,
  PaginatedResponse,
  // Public types
  PublicService,
  PublicStaff,
  TimeSlot,
  PublicStoreInfo,
  // Status enums
  OnlineBookingStatus,
  GiftCardStatus,
  OrderStatus,
  ReviewStatus,
  MembershipStatus,
  BookingSource,
} from './types';
