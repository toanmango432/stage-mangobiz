/**
 * Staff Repository - Data access for staff/team members
 *
 * Handles all staff-related database operations for the Online Store.
 * Staff are the professionals who perform services.
 */

import { BaseRepository, APIError, QueryOptions, QueryResult } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';

// Staff row type matching database schema
export interface StaffRow {
  id: string;
  store_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  title: string | null;
  specialties: string[] | null;
  is_active: boolean;
  show_online: boolean;
  display_order: number;
  work_schedule: any; // JSON field for availability
  created_at: string;
  updated_at: string;
}

// Staff service assignment
export interface StaffServiceRow {
  staff_id: string;
  service_id: string;
}

// Frontend-friendly staff format
export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  title: string | null;
  specialties: string[];
  isActive: boolean;
  showOnline: boolean;
  displayOrder: number;
  serviceIds?: string[];
}

/**
 * Convert database row to frontend format
 */
function toStaffMember(row: StaffRow, serviceIds?: string[]): StaffMember {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    title: row.title,
    specialties: row.specialties || [],
    isActive: row.is_active,
    showOnline: row.show_online,
    displayOrder: row.display_order,
    serviceIds,
  };
}

/**
 * Staff Repository
 */
export class StaffRepository extends BaseRepository<StaffRow> {
  constructor() {
    super('staff');
  }

  /**
   * Get all staff members available for online booking
   */
  async getOnlineStaff(): Promise<StaffMember[]> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from('staff')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .eq('show_online', true)
          .order('display_order', { ascending: true })
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return (data || []).map((row) => toStaffMember(row as StaffRow));
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get staff members who can perform a specific service
   */
  async getStaffForService(serviceId: string): Promise<StaffMember[]> {
    try {
      const storeId = this.getStoreId();

      // First get staff IDs assigned to this service
      const { data: assignments, error: assignError } = await withCircuitBreaker(() =>
        supabase
          .from('staff_services')
          .select('staff_id')
          .eq('service_id', serviceId)
      );

      if (assignError) {
        // If staff_services table doesn't exist or is empty, return all online staff
        console.warn('staff_services table may not exist, returning all online staff');
        return this.getOnlineStaff();
      }

      if (!assignments || assignments.length === 0) {
        // No specific assignments - return all online staff as they can all perform it
        return this.getOnlineStaff();
      }

      const staffIds = assignments.map((a) => a.staff_id);

      // Get staff details for assigned staff
      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from('staff')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .eq('show_online', true)
          .in('id', staffIds)
          .order('display_order', { ascending: true })
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return (data || []).map((row) => toStaffMember(row as StaffRow));
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get a single staff member by ID
   */
  async getStaffById(id: string): Promise<StaffMember | null> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from('staff')
          .select('*')
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

      // Get service assignments for this staff member
      const { data: services } = await supabase
        .from('staff_services')
        .select('service_id')
        .eq('staff_id', id);

      const serviceIds = services?.map((s) => s.service_id) || [];

      return toStaffMember(data as StaffRow, serviceIds);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get staff availability for a specific date
   * Returns working hours and existing appointments
   */
  async getStaffAvailability(staffId: string, date: string): Promise<{
    workingHours: { start: string; end: string } | null;
    bookedSlots: { start: string; end: string }[];
  }> {
    try {
      const storeId = this.getStoreId();

      // Get staff work schedule
      const { data: staffData, error: staffError } = await withCircuitBreaker(() =>
        supabase
          .from('staff')
          .select('work_schedule')
          .eq('id', staffId)
          .eq('store_id', storeId)
          .single()
      );

      if (staffError || !staffData) {
        return { workingHours: null, bookedSlots: [] };
      }

      // Parse work schedule for the given day
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
      const schedule = staffData.work_schedule?.[dayOfWeek];

      // Get existing appointments for this staff on this date
      const { data: appointments, error: apptError } = await withCircuitBreaker(() =>
        supabase
          .from('appointments')
          .select('start_time, end_time')
          .eq('staff_id', staffId)
          .eq('store_id', storeId)
          .gte('start_time', `${date}T00:00:00`)
          .lt('start_time', `${date}T23:59:59`)
          .not('status', 'in', '("cancelled", "no_show")')
      );

      const bookedSlots = (appointments || []).map((appt: any) => ({
        start: appt.start_time,
        end: appt.end_time,
      }));

      return {
        workingHours: schedule || { start: '09:00', end: '18:00' }, // Default hours if not set
        bookedSlots,
      };
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get available time slots for a staff member on a date
   */
  async getAvailableSlots(
    staffId: string,
    date: string,
    serviceDuration: number // in minutes
  ): Promise<string[]> {
    try {
      const { workingHours, bookedSlots } = await this.getStaffAvailability(staffId, date);

      if (!workingHours) {
        return []; // Staff not working this day
      }

      const slots: string[] = [];
      const slotInterval = 30; // 30-minute intervals

      // Parse working hours
      const [startHour, startMin] = workingHours.start.split(':').map(Number);
      const [endHour, endMin] = workingHours.end.split(':').map(Number);

      const workStart = startHour * 60 + startMin;
      const workEnd = endHour * 60 + endMin;

      // Generate all possible slots
      for (let time = workStart; time + serviceDuration <= workEnd; time += slotInterval) {
        const slotStart = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
        const slotEndMinutes = time + serviceDuration;
        const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;

        // Check if this slot conflicts with any booked appointments
        const isAvailable = !bookedSlots.some((booked) => {
          const bookedStart = booked.start.split('T')[1]?.substring(0, 5) || booked.start;
          const bookedEnd = booked.end.split('T')[1]?.substring(0, 5) || booked.end;

          // Check for overlap
          return slotStart < bookedEnd && slotEnd > bookedStart;
        });

        if (isAvailable) {
          slots.push(slotStart);
        }
      }

      return slots;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

// Singleton instance
export const staffRepository = new StaffRepository();
