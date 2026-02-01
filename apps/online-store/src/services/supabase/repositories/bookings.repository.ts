/**
 * Bookings Repository - Data access for online bookings
 *
 * Handles all booking-related database operations for the Online Store.
 * Online bookings are stored in a separate table from POS appointments
 * and are converted to appointments when confirmed by staff.
 */

import { BaseRepository, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';

// Helper to get untyped supabase access for queries using 'online_bookings' table
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untypedSupabase = supabase as any;

// Online booking status
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

// Online booking row type matching database schema
export interface OnlineBookingRow {
  id: string;
  store_id: string;
  client_id: string | null;
  service_id: string;
  staff_id: string | null; // NULL = any available staff
  requested_date: string;
  requested_time: string;
  status: BookingStatus;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  source: string;
  appointment_id: string | null; // Linked appointment after confirmation
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
}

// Create booking request
export interface CreateBookingData {
  serviceId: string;
  staffId?: string | null;
  requestedDate: string;
  requestedTime: string;
  clientId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  notes?: string | null;
}

// Frontend-friendly booking format
export interface OnlineBooking {
  id: string;
  serviceId: string;
  staffId: string | null;
  requestedDate: string;
  requestedTime: string;
  status: BookingStatus;
  clientId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  notes: string | null;
  source: string;
  appointmentId: string | null;
  createdAt: string;
  confirmedAt: string | null;
  // Joined data
  serviceName?: string;
  staffName?: string;
}

/**
 * Convert database row to frontend format
 */
function toOnlineBooking(row: OnlineBookingRow & { service?: any; staff?: any }): OnlineBooking {
  return {
    id: row.id,
    serviceId: row.service_id,
    staffId: row.staff_id,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    status: row.status,
    clientId: row.client_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    notes: row.notes,
    source: row.source,
    appointmentId: row.appointment_id,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    serviceName: row.service?.name,
    staffName: row.staff ? `${row.staff.first_name} ${row.staff.last_name}` : undefined,
  };
}

/**
 * Bookings Repository
 */
export class BookingsRepository extends BaseRepository<OnlineBookingRow> {
  constructor() {
    super('online_bookings');
  }

  /**
   * Create a new online booking
   */
  async createBooking(data: CreateBookingData): Promise<OnlineBooking> {
    try {
      const storeId = this.getStoreId();

      // Validate required fields
      if (!data.serviceId) {
        throw APIError.badRequest('Service ID is required');
      }
      if (!data.requestedDate || !data.requestedTime) {
        throw APIError.badRequest('Date and time are required');
      }

      // If not logged in, guest info is required
      if (!data.clientId && (!data.guestName || !data.guestEmail)) {
        throw APIError.badRequest('Guest name and email are required for non-logged-in bookings');
      }

      const bookingData = {
        store_id: storeId,
        service_id: data.serviceId,
        staff_id: data.staffId || null,
        requested_date: data.requestedDate,
        requested_time: data.requestedTime,
        client_id: data.clientId || null,
        guest_name: data.guestName || null,
        guest_email: data.guestEmail || null,
        guest_phone: data.guestPhone || null,
        notes: data.notes || null,
        status: 'pending' as BookingStatus,
        source: 'online_store',
      };

      const { data: result, error } = await withCircuitBreaker(async () =>
        untypedSupabase
          .from('online_bookings')
          .insert(bookingData)
          .select(`
            *,
            service:services(name),
            staff(first_name, last_name)
          `)
          .single()
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return toOnlineBooking(result as OnlineBookingRow & { service?: any; staff?: any });
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<OnlineBooking | null> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(async () =>
        untypedSupabase
          .from('online_bookings')
          .select(`
            *,
            service:services(name),
            staff(first_name, last_name)
          `)
          .eq('id', id)
          .eq('store_id', storeId)
          .single()
      );

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw APIError.fromSupabaseError(error);
      }

      return toOnlineBooking(data as OnlineBookingRow & { service?: any; staff?: any });
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get bookings for a client
   */
  async getClientBookings(clientId: string): Promise<OnlineBooking[]> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(async () =>
        untypedSupabase
          .from('online_bookings')
          .select(`
            *,
            service:services(name),
            staff(first_name, last_name)
          `)
          .eq('store_id', storeId)
          .eq('client_id', clientId)
          .order('requested_date', { ascending: false })
          .order('requested_time', { ascending: false })
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return ((data || []) as (OnlineBookingRow & { service?: any; staff?: any })[]).map(toOnlineBooking);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get bookings by email (for guest lookups)
   */
  async getBookingsByEmail(email: string): Promise<OnlineBooking[]> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(async () =>
        untypedSupabase
          .from('online_bookings')
          .select(`
            *,
            service:services(name),
            staff(first_name, last_name)
          `)
          .eq('store_id', storeId)
          .eq('guest_email', email)
          .order('requested_date', { ascending: false })
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return ((data || []) as (OnlineBookingRow & { service?: any; staff?: any })[]).map(toOnlineBooking);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(id: string): Promise<OnlineBooking> {
    try {
      const storeId = this.getStoreId();

      // First check if booking can be cancelled
      const existing = await this.getBookingById(id);
      if (!existing) {
        throw APIError.notFound('Booking', id);
      }

      if (['cancelled', 'completed', 'no_show'].includes(existing.status)) {
        throw APIError.badRequest(`Cannot cancel a ${existing.status} booking`);
      }

      const { data, error } = await withCircuitBreaker(async () =>
        untypedSupabase
          .from('online_bookings')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('store_id', storeId)
          .select(`
            *,
            service:services(name),
            staff(first_name, last_name)
          `)
          .single()
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return toOnlineBooking(data as OnlineBookingRow & { service?: any; staff?: any });
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    id: string,
    newDate: string,
    newTime: string,
    newStaffId?: string
  ): Promise<OnlineBooking> {
    try {
      const storeId = this.getStoreId();

      // Check if booking can be rescheduled
      const existing = await this.getBookingById(id);
      if (!existing) {
        throw APIError.notFound('Booking', id);
      }

      if (['cancelled', 'completed', 'no_show'].includes(existing.status)) {
        throw APIError.badRequest(`Cannot reschedule a ${existing.status} booking`);
      }

      const updateData: any = {
        requested_date: newDate,
        requested_time: newTime,
        status: 'pending', // Reset to pending for new confirmation
        updated_at: new Date().toISOString(),
      };

      if (newStaffId !== undefined) {
        updateData.staff_id = newStaffId;
      }

      const { data, error } = await withCircuitBreaker(async () =>
        untypedSupabase
          .from('online_bookings')
          .update(updateData)
          .eq('id', id)
          .eq('store_id', storeId)
          .select(`
            *,
            service:services(name),
            staff(first_name, last_name)
          `)
          .single()
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return toOnlineBooking(data as OnlineBookingRow & { service?: any; staff?: any });
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get upcoming bookings for a client
   */
  async getUpcomingBookings(clientId: string): Promise<OnlineBooking[]> {
    try {
      const storeId = this.getStoreId();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await withCircuitBreaker(async () =>
        untypedSupabase
          .from('online_bookings')
          .select(`
            *,
            service:services(name),
            staff(first_name, last_name)
          `)
          .eq('store_id', storeId)
          .eq('client_id', clientId)
          .gte('requested_date', today)
          .in('status', ['pending', 'confirmed'])
          .order('requested_date', { ascending: true })
          .order('requested_time', { ascending: true })
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return ((data || []) as (OnlineBookingRow & { service?: any; staff?: any })[]).map(toOnlineBooking);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get past bookings for a client
   */
  async getPastBookings(clientId: string, limit = 10): Promise<OnlineBooking[]> {
    try {
      const storeId = this.getStoreId();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await withCircuitBreaker(async () =>
        untypedSupabase
          .from('online_bookings')
          .select(`
            *,
            service:services(name),
            staff(first_name, last_name)
          `)
          .eq('store_id', storeId)
          .eq('client_id', clientId)
          .or(`requested_date.lt.${today},status.in.(completed,cancelled,no_show)`)
          .order('requested_date', { ascending: false })
          .limit(limit)
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return ((data || []) as (OnlineBookingRow & { service?: any; staff?: any })[]).map(toOnlineBooking);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

// Singleton instance
export const bookingsRepository = new BookingsRepository();
