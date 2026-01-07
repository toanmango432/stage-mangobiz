/**
 * React Query Hooks Barrel Export
 *
 * All data fetching hooks using React Query.
 * These hooks provide caching, error handling, and loading states.
 */

// Services hooks
export {
  serviceKeys,
  useServices,
  useServicesByCategory,
  useService,
  useSearchServices,
  useServiceCategories,
  usePrefetchService,
} from './useServices';

// Staff hooks
export {
  staffKeys,
  useStaff,
  useStaffForService,
  useStaffMember,
  useStaffAvailability,
  useAvailableSlots,
  usePrefetchStaff,
} from './useStaff';

// Booking hooks
export {
  bookingKeys,
  useBooking,
  useClientBookings,
  useUpcomingBookings,
  usePastBookings,
  useBookingsByEmail,
  useCreateBooking,
  useCancelBooking,
  useRescheduleBooking,
} from './useBookings';
