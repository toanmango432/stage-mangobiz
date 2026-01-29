/**
 * Repositories Barrel Export
 *
 * Central export point for all data repositories.
 * Repositories handle data access with multi-tenant isolation.
 */

// Import first for use in initializeRepositories
import { servicesRepository as _servicesRepo } from './services.repository';
import { staffRepository as _staffRepo } from './staff.repository';
import { bookingsRepository as _bookingsRepo } from './bookings.repository';

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
 *
 * Note: During Next.js SSR build, repositories may not be available.
 * This function is called via useStore hook which is only used in client components.
 */
export function initializeRepositories(storeId: string): void {
  // Use imported references (resolved at module load time)
  // Guard against SSR where repositories may not be initialized
  if (typeof _servicesRepo?.setStoreContext === 'function') {
    _servicesRepo.setStoreContext(storeId);
  }
  if (typeof _staffRepo?.setStoreContext === 'function') {
    _staffRepo.setStoreContext(storeId);
  }
  if (typeof _bookingsRepo?.setStoreContext === 'function') {
    _bookingsRepo.setStoreContext(storeId);
  }
}
