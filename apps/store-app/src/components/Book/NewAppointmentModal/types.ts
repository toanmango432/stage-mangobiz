/**
 * Shared types for NewAppointmentModal components
 */

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * Embedded variant info for booking UI display
 */
export interface BookingVariant {
  id: string;
  name: string;
  duration: number;
  price: number;
  isDefault?: boolean;
}

/** Booking availability for a service */
export type BookingAvailability = 'online' | 'in-store' | 'both' | 'disabled';

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  /** Whether this service has variants */
  hasVariants?: boolean;
  /** Embedded variants for services with hasVariants=true */
  variants?: BookingVariant[];
  /** Booking availability: online, in-store, both, or disabled */
  bookingAvailability?: BookingAvailability;
  /** Whether this service requires a patch test */
  requiresPatchTest?: boolean;
}

/**
 * Service with selected variant info for adding to appointment
 */
export interface ServiceWithVariantSelection extends Service {
  /** If a variant was selected, the variant ID */
  selectedVariantId?: string;
  /** If a variant was selected, the variant name */
  selectedVariantName?: string;
  /** Final price (may differ from service price if variant selected) */
  finalPrice: number;
  /** Final duration (may differ from service duration if variant selected) */
  finalDuration: number;
}

export interface ServiceWithTime extends Service {
  startTime: string;
  endTime: string;
}

export interface StaffWithServices {
  staffId: string;
  staffName: string;
  services: ServiceWithTime[];
  isExpanded: boolean;
  isRequested?: boolean;
}

export interface BookingGuest {
  id: string;
  name: string;
  isNamed: boolean;
  clientId?: string;
  phone?: string;
  startTime?: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    serviceCategory: string;
    duration: number;
    price: number;
    staffId: string;
    staffName: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}
