/**
 * Staff Service Assignments Table Operations
 * CRUD operations for the staff_service_assignments table in Supabase
 */

import { supabase } from '../client';
import type {
  StaffServiceAssignmentRow,
  StaffServiceAssignmentInsert,
  StaffServiceAssignmentUpdate,
} from '../types';

export const staffServiceAssignmentsTable = {
  /**
   * Get all assignments for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive assignments (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<StaffServiceAssignmentRow[]> {
    let query = supabase
      .from('staff_service_assignments')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single assignment by ID
   */
  async getById(id: string): Promise<StaffServiceAssignmentRow | null> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get all assignments for a specific staff member
   * @param staffId - The staff member ID
   * @param includeInactive - Whether to include inactive assignments
   */
  async getByStaffId(
    staffId: string,
    includeInactive = false
  ): Promise<StaffServiceAssignmentRow[]> {
    let query = supabase
      .from('staff_service_assignments')
      .select('*')
      .eq('staff_id', staffId)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all assignments for a specific service
   * @param serviceId - The service ID
   * @param includeInactive - Whether to include inactive assignments
   */
  async getByServiceId(
    serviceId: string,
    includeInactive = false
  ): Promise<StaffServiceAssignmentRow[]> {
    let query = supabase
      .from('staff_service_assignments')
      .select('*')
      .eq('service_id', serviceId)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get assignment for a specific staff-service pair
   * @param staffId - The staff member ID
   * @param serviceId - The service ID
   */
  async getByStaffAndService(
    staffId: string,
    serviceId: string
  ): Promise<StaffServiceAssignmentRow | null> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .select('*')
      .eq('staff_id', staffId)
      .eq('service_id', serviceId)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Create a new assignment
   */
  async create(
    assignment: StaffServiceAssignmentInsert
  ): Promise<StaffServiceAssignmentRow> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing assignment
   */
  async update(
    id: string,
    updates: StaffServiceAssignmentUpdate
  ): Promise<StaffServiceAssignmentRow> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Soft delete an assignment (tombstone pattern)
   * @param id - Assignment ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('staff_service_assignments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_device: deviceId,
        tombstone_expires_at: tombstoneExpiresAt.toISOString(),
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Delete all assignments for a staff member (when staff is deleted)
   */
  async deleteByStaffId(
    staffId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30);

    const { error } = await supabase
      .from('staff_service_assignments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_device: deviceId,
        tombstone_expires_at: tombstoneExpiresAt.toISOString(),
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('staff_id', staffId)
      .eq('is_deleted', false);

    if (error) throw error;
  },

  /**
   * Delete all assignments for a service (when service is deleted)
   */
  async deleteByServiceId(
    serviceId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30);

    const { error } = await supabase
      .from('staff_service_assignments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_device: deviceId,
        tombstone_expires_at: tombstoneExpiresAt.toISOString(),
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('service_id', serviceId)
      .eq('is_deleted', false);

    if (error) throw error;
  },

  /**
   * Hard delete an assignment (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff_service_assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get assignments updated since a specific time (for sync)
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<StaffServiceAssignmentRow[]> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert assignments (for sync)
   */
  async upsertMany(
    assignments: StaffServiceAssignmentInsert[]
  ): Promise<StaffServiceAssignmentRow[]> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .upsert(assignments, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Activate an assignment
   */
  async activate(id: string): Promise<StaffServiceAssignmentRow> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .update({
        is_active: true,
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deactivate an assignment
   */
  async deactivate(id: string): Promise<StaffServiceAssignmentRow> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .update({
        is_active: false,
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update custom pricing for a staff-service assignment
   */
  async updateCustomPricing(
    id: string,
    customPrice: number | null,
    customDuration: number | null,
    customCommissionRate: number | null
  ): Promise<StaffServiceAssignmentRow> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .update({
        custom_price: customPrice,
        custom_duration: customDuration,
        custom_commission_rate: customCommissionRate,
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get staff IDs that can perform a service
   * @param serviceId - The service ID
   */
  async getStaffIdsForService(serviceId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .select('staff_id')
      .eq('service_id', serviceId)
      .eq('is_deleted', false)
      .eq('is_active', true);

    if (error) throw error;
    return data?.map((row) => row.staff_id) || [];
  },

  /**
   * Get service IDs a staff member can perform
   * @param staffId - The staff member ID
   */
  async getServiceIdsForStaff(staffId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('staff_service_assignments')
      .select('service_id')
      .eq('staff_id', staffId)
      .eq('is_deleted', false)
      .eq('is_active', true);

    if (error) throw error;
    return data?.map((row) => row.service_id) || [];
  },

  /**
   * Assign a staff member to a service (upsert by staff_id + service_id)
   */
  async assignStaffToService(
    storeId: string,
    staffId: string,
    serviceId: string,
    assignment: Omit<
      StaffServiceAssignmentInsert,
      'store_id' | 'staff_id' | 'service_id'
    >
  ): Promise<StaffServiceAssignmentRow> {
    // Check if assignment already exists
    const existing = await this.getByStaffAndService(staffId, serviceId);

    if (existing) {
      // Update existing assignment
      return this.update(existing.id, {
        ...assignment,
        is_active: true,
        is_deleted: false,
      });
    }

    // Create new assignment
    return this.create({
      ...assignment,
      store_id: storeId,
      staff_id: staffId,
      service_id: serviceId,
    });
  },

  /**
   * Remove a staff member from a service
   */
  async removeStaffFromService(
    staffId: string,
    serviceId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const existing = await this.getByStaffAndService(staffId, serviceId);
    if (existing) {
      await this.delete(existing.id, userId, deviceId);
    }
  },
};
