/**
 * Services Repository - Data access for services/treatments
 *
 * Handles all service-related database operations for the Online Store.
 * Services are the treatments/offerings that customers can book.
 */

import { BaseRepository, APIError, QueryOptions, QueryResult } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';

// Service type matching database schema
export interface ServiceRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  duration: number; // in minutes
  price: number;
  is_active: boolean;
  show_online: boolean;
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Service category type
export interface ServiceCategoryRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Service with category joined
export interface ServiceWithCategory extends ServiceRow {
  category: ServiceCategoryRow | null;
}

// Frontend-friendly service format
export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  displayOrder: number;
  isActive: boolean;
  showOnline: boolean;
}

/**
 * Convert database row to frontend format
 */
function toService(row: ServiceWithCategory): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    duration: row.duration,
    price: row.price,
    imageUrl: row.image_url,
    categoryId: row.category_id,
    categoryName: row.category?.name || null,
    displayOrder: row.display_order,
    isActive: row.is_active,
    showOnline: row.show_online,
  };
}

/**
 * Services Repository
 */
export class ServicesRepository extends BaseRepository<ServiceRow> {
  constructor() {
    super('services');
  }

  /**
   * Get all services available for online booking
   * Only returns active services that are marked for online display
   */
  async getOnlineServices(): Promise<Service[]> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from('services')
          .select(`
            *,
            category:service_categories(id, store_id, name, description, display_order, is_active)
          `)
          .eq('store_id', storeId)
          .eq('is_active', true)
          .eq('show_online', true)
          .order('display_order', { ascending: true })
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return (data || []).map((row: any) => toService(row as ServiceWithCategory));
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get services grouped by category
   */
  async getServicesByCategory(): Promise<Map<string, Service[]>> {
    const services = await this.getOnlineServices();
    const grouped = new Map<string, Service[]>();

    // Group services by category
    for (const service of services) {
      const categoryName = service.categoryName || 'Other';
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName)!.push(service);
    }

    return grouped;
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(id: string): Promise<Service | null> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from('services')
          .select(`
            *,
            category:service_categories(id, store_id, name, description, display_order, is_active)
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

      return toService(data as ServiceWithCategory);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Search services by name
   */
  async searchServices(query: string): Promise<Service[]> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from('services')
          .select(`
            *,
            category:service_categories(id, store_id, name, description, display_order, is_active)
          `)
          .eq('store_id', storeId)
          .eq('is_active', true)
          .eq('show_online', true)
          .ilike('name', `%${query}%`)
          .order('display_order', { ascending: true })
          .limit(20)
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return (data || []).map((row: any) => toService(row as ServiceWithCategory));
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get services by category ID
   */
  async getServicesByCategoryId(categoryId: string): Promise<Service[]> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from('services')
          .select(`
            *,
            category:service_categories(id, store_id, name, description, display_order, is_active)
          `)
          .eq('store_id', storeId)
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .eq('show_online', true)
          .order('display_order', { ascending: true })
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return (data || []).map((row: any) => toService(row as ServiceWithCategory));
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get all service categories
   */
  async getCategories(): Promise<ServiceCategoryRow[]> {
    try {
      const storeId = this.getStoreId();

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from('service_categories')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
      );

      if (error) {
        throw APIError.fromSupabaseError(error);
      }

      return data || [];
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

// Singleton instance
export const servicesRepository = new ServicesRepository();
