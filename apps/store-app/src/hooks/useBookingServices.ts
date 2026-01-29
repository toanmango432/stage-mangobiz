/**
 * useBookingServices Hook
 * Hook for booking-specific service filtering and validation
 *
 * @see US-060 - Create useBookingServices hook
 *
 * Features:
 * - Filter services by bookingAvailability (online/in-store/both/disabled)
 * - Validate advance booking window (advanceBookingDaysMin/Max)
 * - Check patch test requirements against client history
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { menuServicesDB, serviceVariantsDB } from '../db/database';
import { patchTestsDB } from '../db/database';
import type {
  MenuService,
  BookingAvailability,
  EmbeddedVariant,
  MenuServiceWithEmbeddedVariants,
} from '../types/catalog';

// ============================================
// Types
// ============================================

export type BookingContext = 'online' | 'in-store';

export interface UseBookingServicesOptions {
  /** Store ID for tenant isolation */
  storeId: string;
  /** Booking context: online or in-store */
  context: BookingContext;
  /** Include inactive services (default: false) */
  includeInactive?: boolean;
  /** Include services with variants embedded (default: false) */
  embedVariants?: boolean;
}

export interface BookingService extends MenuServiceWithEmbeddedVariants {
  /** Whether the service is available for the current booking context */
  isAvailableForBooking: boolean;
  /** Reason if not available */
  unavailabilityReason?: string;
}

export interface PatchTestStatus {
  /** Whether the client has a valid patch test for this service */
  hasValidTest: boolean;
  /** If test exists but is expiring soon (within 14 days) */
  isExpiringSoon: boolean;
  /** Days until test expires (if exists) */
  daysUntilExpiry?: number;
  /** When the test expires */
  expiresAt?: Date;
}

export interface UseBookingServicesResult {
  /** All services filtered for the booking context */
  services: BookingService[];
  /** Services that require patch tests */
  servicesRequiringPatchTest: BookingService[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;

  /**
   * Check if a service is valid for online booking on a specific date
   * Validates advance booking window (min/max days)
   */
  isValidForOnlineBooking: (serviceId: string, bookingDate: Date) => boolean;

  /**
   * Check if a service requires a patch test
   */
  requiresPatchTest: (serviceId: string) => boolean;

  /**
   * Get patch test status for a client and service
   */
  getPatchTestStatus: (serviceId: string, clientId: string) => Promise<PatchTestStatus>;

  /**
   * Get advance booking window for a service
   */
  getAdvanceBookingWindow: (serviceId: string) => {
    minDays: number;
    maxDays: number;
    earliestDate: Date;
    latestDate: Date;
  };

  /**
   * Filter services by category
   */
  getServicesByCategory: (categoryId: string) => BookingService[];

  /**
   * Search services by name
   */
  searchServices: (query: string) => BookingService[];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a service is available for a given booking context
 */
function isServiceAvailableForContext(
  service: MenuService,
  context: BookingContext
): { available: boolean; reason?: string } {
  const availability = service.bookingAvailability;

  // Handle disabled services
  if (availability === 'disabled') {
    return { available: false, reason: 'Service is disabled for booking' };
  }

  // Handle online context
  if (context === 'online') {
    if (availability === 'in-store') {
      return { available: false, reason: 'Only available for in-store booking' };
    }
    if (!service.onlineBookingEnabled) {
      return { available: false, reason: 'Online booking not enabled' };
    }
    // 'online' or 'both' are valid for online context
    return { available: true };
  }

  // Handle in-store context
  if (context === 'in-store') {
    if (availability === 'online') {
      return { available: false, reason: 'Only available for online booking' };
    }
    // 'in-store' or 'both' are valid for in-store context
    return { available: true };
  }

  return { available: true };
}

/**
 * Calculate advance booking window dates
 */
function calculateBookingWindow(
  minDays: number,
  maxDays: number,
  bufferMinutes: number = 0
): { earliestDate: Date; latestDate: Date } {
  const now = new Date();

  // Apply buffer (can't book within buffer minutes of now)
  const bufferedNow = new Date(now.getTime() + bufferMinutes * 60 * 1000);

  // Calculate earliest date (minDays from now, at start of day)
  const earliestDate = new Date(bufferedNow);
  earliestDate.setDate(earliestDate.getDate() + minDays);
  earliestDate.setHours(0, 0, 0, 0);

  // Calculate latest date (maxDays from now, at end of day)
  const latestDate = new Date(bufferedNow);
  latestDate.setDate(latestDate.getDate() + maxDays);
  latestDate.setHours(23, 59, 59, 999);

  return { earliestDate, latestDate };
}

/**
 * Check if a date falls within the advance booking window
 */
function isDateWithinBookingWindow(
  bookingDate: Date,
  minDays: number,
  maxDays: number,
  bufferMinutes: number = 0
): boolean {
  const { earliestDate, latestDate } = calculateBookingWindow(
    minDays,
    maxDays,
    bufferMinutes
  );

  const normalizedBookingDate = new Date(bookingDate);
  normalizedBookingDate.setHours(0, 0, 0, 0);

  return (
    normalizedBookingDate >= earliestDate && normalizedBookingDate <= latestDate
  );
}

// ============================================
// Hook Implementation
// ============================================

export function useBookingServices(
  options: UseBookingServicesOptions
): UseBookingServicesResult {
  const {
    storeId,
    context,
    includeInactive = false,
    embedVariants = false,
  } = options;

  const [services, setServices] = useState<BookingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load services on mount and when options change
  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      if (!storeId) {
        setIsLoading(false);
        setServices([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load all active services
        const allServices = await menuServicesDB.getAll(storeId);

        // Filter by status
        const filteredByStatus = includeInactive
          ? allServices
          : allServices.filter((s) => s.status === 'active');

        // Load variants if needed
        let variantsByService = new Map<string, EmbeddedVariant[]>();
        if (embedVariants) {
          const servicesWithVariants = filteredByStatus.filter(
            (s) => s.hasVariants
          );
          await Promise.all(
            servicesWithVariants.map(async (service) => {
              const variants = await serviceVariantsDB.getByService(service.id);
              variantsByService.set(
                service.id,
                variants.map((v) => ({
                  id: v.id,
                  name: v.name,
                  price: v.price,
                  duration: v.duration,
                  isDefault: v.isDefault,
                }))
              );
            })
          );
        }

        // Map to BookingService with availability info
        const bookingServices: BookingService[] = filteredByStatus.map(
          (service) => {
            const { available, reason } = isServiceAvailableForContext(
              service,
              context
            );

            return {
              ...service,
              variants: variantsByService.get(service.id) || [],
              isAvailableForBooking: available,
              unavailabilityReason: reason,
            };
          }
        );

        if (isMounted) {
          setServices(bookingServices);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load booking services'
          );
          setIsLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      isMounted = false;
    };
  }, [storeId, context, includeInactive, embedVariants]);

  // Services that require patch tests
  const servicesRequiringPatchTest = useMemo(
    () => services.filter((s) => s.requiresPatchTest),
    [services]
  );

  // Create a map for quick service lookup
  const serviceMap = useMemo(() => {
    return new Map(services.map((s) => [s.id, s]));
  }, [services]);

  // Check if a service is valid for online booking on a specific date
  const isValidForOnlineBooking = useCallback(
    (serviceId: string, bookingDate: Date): boolean => {
      const service = serviceMap.get(serviceId);
      if (!service) return false;

      // Check if available for online booking
      if (
        service.bookingAvailability !== 'online' &&
        service.bookingAvailability !== 'both'
      ) {
        return false;
      }

      if (!service.onlineBookingEnabled) {
        return false;
      }

      // Check advance booking window
      const minDays = service.advanceBookingDaysMin ?? 0;
      const maxDays = service.advanceBookingDaysMax ?? 365; // Default to 1 year
      const bufferMinutes = service.onlineBookingBufferMinutes ?? 0;

      return isDateWithinBookingWindow(
        bookingDate,
        minDays,
        maxDays,
        bufferMinutes
      );
    },
    [serviceMap]
  );

  // Check if a service requires a patch test
  const requiresPatchTest = useCallback(
    (serviceId: string): boolean => {
      const service = serviceMap.get(serviceId);
      return service?.requiresPatchTest ?? false;
    },
    [serviceMap]
  );

  // Get patch test status for a client and service
  const getPatchTestStatus = useCallback(
    async (serviceId: string, clientId: string): Promise<PatchTestStatus> => {
      try {
        // Get valid patch test for this service
        const validTest = await patchTestsDB.getValidForService(
          clientId,
          serviceId
        );

        if (!validTest) {
          return {
            hasValidTest: false,
            isExpiringSoon: false,
          };
        }

        // Calculate days until expiry
        const now = new Date();
        const expiresAt = new Date(validTest.expiresAt);
        const daysUntilExpiry = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          hasValidTest: true,
          isExpiringSoon: daysUntilExpiry <= 14, // Expiring within 2 weeks
          daysUntilExpiry,
          expiresAt,
        };
      } catch (err) {
        // If patch test lookup fails, assume no valid test
        console.warn('Failed to check patch test status:', err);
        return {
          hasValidTest: false,
          isExpiringSoon: false,
        };
      }
    },
    []
  );

  // Get advance booking window for a service
  const getAdvanceBookingWindow = useCallback(
    (
      serviceId: string
    ): {
      minDays: number;
      maxDays: number;
      earliestDate: Date;
      latestDate: Date;
    } => {
      const service = serviceMap.get(serviceId);
      const minDays = service?.advanceBookingDaysMin ?? 0;
      const maxDays = service?.advanceBookingDaysMax ?? 365;
      const bufferMinutes = service?.onlineBookingBufferMinutes ?? 0;

      const { earliestDate, latestDate } = calculateBookingWindow(
        minDays,
        maxDays,
        bufferMinutes
      );

      return { minDays, maxDays, earliestDate, latestDate };
    },
    [serviceMap]
  );

  // Filter services by category
  const getServicesByCategory = useCallback(
    (categoryId: string): BookingService[] => {
      return services.filter((s) => s.categoryId === categoryId);
    },
    [services]
  );

  // Search services by name
  const searchServices = useCallback(
    (query: string): BookingService[] => {
      if (!query.trim()) return services;

      const lowerQuery = query.toLowerCase();
      return services.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerQuery) ||
          (s.description?.toLowerCase().includes(lowerQuery) ?? false)
      );
    },
    [services]
  );

  return {
    services,
    servicesRequiringPatchTest,
    isLoading,
    error,
    isValidForOnlineBooking,
    requiresPatchTest,
    getPatchTestStatus,
    getAdvanceBookingWindow,
    getServicesByCategory,
    searchServices,
  };
}

export default useBookingServices;
