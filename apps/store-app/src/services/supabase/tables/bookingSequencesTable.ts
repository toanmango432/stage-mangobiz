/**
 * Booking Sequences Table Operations
 * CRUD operations for the booking_sequences table in Supabase
 */

import { supabase } from '../client';
import type { Json } from '../types';
import type {
  BookingSequenceRow,
  BookingSequenceInsert,
  BookingSequenceUpdate,
} from '../types';

export const bookingSequencesTable = {
  /**
   * Get all booking sequences for a store
   * @param storeId - The store ID
   * @param enabledOnly - Whether to return only enabled sequences (default: false)
   */
  async getByStoreId(
    storeId: string,
    enabledOnly = false
  ): Promise<BookingSequenceRow[]> {
    let query = supabase
      .from('booking_sequences')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false);

    if (enabledOnly) {
      query = query.eq('is_enabled', true);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single booking sequence by ID
   */
  async getById(id: string): Promise<BookingSequenceRow | null> {
    const { data, error } = await supabase
      .from('booking_sequences')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get enabled booking sequences for a store (for use in booking flow)
   */
  async getEnabled(storeId: string): Promise<BookingSequenceRow[]> {
    return this.getByStoreId(storeId, true);
  },

  /**
   * Create a new booking sequence
   */
  async create(sequence: BookingSequenceInsert): Promise<BookingSequenceRow> {
    const { data, error } = await supabase
      .from('booking_sequences')
      .insert(sequence)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing booking sequence
   */
  async update(
    id: string,
    updates: BookingSequenceUpdate
  ): Promise<BookingSequenceRow> {
    const { data, error } = await supabase
      .from('booking_sequences')
      .update({
        ...updates,
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
   * Soft delete a booking sequence (tombstone pattern)
   * @param id - Sequence ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('booking_sequences')
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
   * Hard delete a booking sequence (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('booking_sequences')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get sequences updated since a specific time (for sync)
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<BookingSequenceRow[]> {
    const { data, error } = await supabase
      .from('booking_sequences')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert sequences (for sync)
   */
  async upsertMany(
    sequences: BookingSequenceInsert[]
  ): Promise<BookingSequenceRow[]> {
    const { data, error } = await supabase
      .from('booking_sequences')
      .upsert(sequences, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Enable a booking sequence
   */
  async enable(id: string): Promise<BookingSequenceRow> {
    const { data, error } = await supabase
      .from('booking_sequences')
      .update({
        is_enabled: true,
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
   * Disable a booking sequence
   */
  async disable(id: string): Promise<BookingSequenceRow> {
    const { data, error } = await supabase
      .from('booking_sequences')
      .update({
        is_enabled: false,
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
   * Update the service order for a booking sequence
   * @param id - Sequence ID
   * @param serviceOrder - Array of service IDs in order
   */
  async updateServiceOrder(
    id: string,
    serviceOrder: string[]
  ): Promise<BookingSequenceRow> {
    const { data, error } = await supabase
      .from('booking_sequences')
      .update({
        service_order: serviceOrder as unknown as Json,
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
   * Add a service to a booking sequence
   * @param id - Sequence ID
   * @param serviceId - Service ID to add
   * @param position - Optional position to insert at (defaults to end)
   */
  async addService(
    id: string,
    serviceId: string,
    position?: number
  ): Promise<BookingSequenceRow> {
    const sequence = await this.getById(id);
    if (!sequence) throw new Error('Booking sequence not found');

    const serviceOrder = (sequence.service_order as string[]) || [];

    // Check if service already exists
    if (serviceOrder.includes(serviceId)) {
      return sequence;
    }

    // Insert at position or append to end
    if (position !== undefined && position >= 0) {
      serviceOrder.splice(position, 0, serviceId);
    } else {
      serviceOrder.push(serviceId);
    }

    return this.updateServiceOrder(id, serviceOrder);
  },

  /**
   * Remove a service from a booking sequence
   * @param id - Sequence ID
   * @param serviceId - Service ID to remove
   */
  async removeService(id: string, serviceId: string): Promise<BookingSequenceRow> {
    const sequence = await this.getById(id);
    if (!sequence) throw new Error('Booking sequence not found');

    const serviceOrder = (sequence.service_order as string[]) || [];
    const newOrder = serviceOrder.filter((sid) => sid !== serviceId);

    return this.updateServiceOrder(id, newOrder);
  },

  /**
   * Reorder a service within a booking sequence
   * @param id - Sequence ID
   * @param serviceId - Service ID to move
   * @param newPosition - New position for the service
   */
  async reorderService(
    id: string,
    serviceId: string,
    newPosition: number
  ): Promise<BookingSequenceRow> {
    const sequence = await this.getById(id);
    if (!sequence) throw new Error('Booking sequence not found');

    const serviceOrder = (sequence.service_order as string[]) || [];
    const currentIndex = serviceOrder.indexOf(serviceId);

    if (currentIndex === -1) {
      throw new Error('Service not found in sequence');
    }

    // Remove from current position
    serviceOrder.splice(currentIndex, 1);
    // Insert at new position
    serviceOrder.splice(newPosition, 0, serviceId);

    return this.updateServiceOrder(id, serviceOrder);
  },

  /**
   * Get the service order array parsed as string[]
   * @param sequence - The booking sequence row
   */
  getServiceOrderArray(sequence: BookingSequenceRow): string[] {
    if (!sequence.service_order) return [];
    if (Array.isArray(sequence.service_order)) {
      return sequence.service_order as string[];
    }
    return [];
  },
};
