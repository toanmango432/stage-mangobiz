/**
 * Repositories Barrel Export
 *
 * Central export point for all data repositories.
 * Repositories handle data access with multi-tenant isolation.
 */

// Base repository
export { BaseRepository, APIError, type QueryOptions, type QueryResult } from './base.repository';

// Services repository
export {
  ServicesRepository,
  servicesRepository,
  type ServiceRow,
  type ServiceCategoryRow,
  type ServiceWithCategory,
  type Service,
} from './services.repository';

// Staff repository
export {
  StaffRepository,
  staffRepository,
  type StaffRow,
  type StaffServiceRow,
  type StaffMember,
} from './staff.repository';

// Bookings repository
export {
  BookingsRepository,
  bookingsRepository,
  type OnlineBookingRow,
  type OnlineBooking,
  type CreateBookingData,
  type BookingStatus,
} from './bookings.repository';

/**
 * Initialize all repositories with store context
 * Call this once when the app loads with a valid store ID
 */
export function initializeRepositories(storeId: string): void {
  servicesRepository.setStoreContext(storeId);
  staffRepository.setStoreContext(storeId);
  bookingsRepository.setStoreContext(storeId);
}
