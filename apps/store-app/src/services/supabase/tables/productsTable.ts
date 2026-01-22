/**
 * Products Table Operations
 * CRUD operations for the catalog_products table in Supabase
 */

import { supabase } from '../client';
import type {
  CatalogProductRow,
  CatalogProductInsert,
  CatalogProductUpdate,
} from '../types';

/**
 * Sanitize search query to prevent SQL injection via PostgREST filters
 * Escapes special characters used in PostgREST query syntax
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[\\%_'"(),.]/g, '') // Remove SQL wildcards and special chars
    .replace(/[<>]/g, '') // Remove potential XSS chars
    .trim()
    .slice(0, 100); // Limit length to prevent DoS
}

export const productsTable = {
  /**
   * Get all products for a store
   * @param storeId - The store ID
   * @param includeInactive - Whether to include inactive products (default: false)
   */
  async getByStoreId(
    storeId: string,
    includeInactive = false
  ): Promise<CatalogProductRow[]> {
    let query = supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single product by ID
   */
  async getById(id: string): Promise<CatalogProductRow | null> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get a product by barcode
   * @param storeId - The store ID (required for multi-tenant isolation)
   * @param barcode - The barcode to search for
   */
  async getByBarcode(
    storeId: string,
    barcode: string
  ): Promise<CatalogProductRow | null> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId) // Multi-tenant isolation
      .eq('barcode', barcode)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get a product by SKU
   * @param storeId - The store ID (required for multi-tenant isolation)
   * @param sku - The SKU to search for
   */
  async getBySku(
    storeId: string,
    sku: string
  ): Promise<CatalogProductRow | null> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId) // Multi-tenant isolation
      .eq('sku', sku)
      .eq('is_deleted', false)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get products by category
   */
  async getByCategory(
    storeId: string,
    category: string,
    includeInactive = false
  ): Promise<CatalogProductRow[]> {
    let query = supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId)
      .eq('category', category)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get products by brand
   */
  async getByBrand(
    storeId: string,
    brand: string,
    includeInactive = false
  ): Promise<CatalogProductRow[]> {
    let query = supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId)
      .eq('brand', brand)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get retail products only
   */
  async getRetailProducts(storeId: string): Promise<CatalogProductRow[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_retail', true)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get backbar products only
   */
  async getBackbarProducts(storeId: string): Promise<CatalogProductRow[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_backbar', true)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get products with low stock (below min_stock_level)
   * Note: This doesn't check actual inventory, just products where min_stock_level is set
   */
  async getLowStockProducts(storeId: string): Promise<CatalogProductRow[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .gt('min_stock_level', 0)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Search products by name, SKU, or barcode
   */
  async search(
    storeId: string,
    query: string,
    limit = 50
  ): Promise<CatalogProductRow[]> {
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!sanitizedQuery) return [];

    // Search by name
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .or(
        `name.ilike.%${sanitizedQuery}%,sku.ilike.%${sanitizedQuery}%,barcode.ilike.%${sanitizedQuery}%`
      )
      .order('name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new product
   */
  async create(product: CatalogProductInsert): Promise<CatalogProductRow> {
    const { data, error } = await supabase
      .from('catalog_products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an existing product
   */
  async update(
    id: string,
    updates: CatalogProductUpdate
  ): Promise<CatalogProductRow> {
    const { data, error } = await supabase
      .from('catalog_products')
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
   * Soft delete a product (tombstone pattern)
   * @param id - Product ID
   * @param userId - User performing the delete
   * @param deviceId - Device performing the delete
   */
  async delete(id: string, userId: string, deviceId: string): Promise<void> {
    const tombstoneExpiresAt = new Date();
    tombstoneExpiresAt.setDate(tombstoneExpiresAt.getDate() + 30); // 30-day tombstone

    const { error } = await supabase
      .from('catalog_products')
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
   * Archive a product (soft archive, recoverable)
   */
  async archive(id: string): Promise<CatalogProductRow> {
    const { data, error } = await supabase
      .from('catalog_products')
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
   * Restore an archived product
   */
  async restore(id: string): Promise<CatalogProductRow> {
    const { data, error } = await supabase
      .from('catalog_products')
      .update({
        is_active: true,
        is_deleted: false,
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
   * Hard delete a product (permanent - use with caution)
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('catalog_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Get products updated since a specific time (for sync)
   */
  async getUpdatedSince(
    storeId: string,
    since: Date
  ): Promise<CatalogProductRow[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('store_id', storeId)
      .gt('updated_at', since.toISOString())
      .order('updated_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Bulk upsert products (for sync)
   */
  async upsertMany(
    products: CatalogProductInsert[]
  ): Promise<CatalogProductRow[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .upsert(products, { onConflict: 'id' })
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Update product pricing
   */
  async updatePricing(
    id: string,
    retailPrice: number,
    costPrice: number
  ): Promise<CatalogProductRow> {
    const margin =
      retailPrice > 0 ? ((retailPrice - costPrice) / retailPrice) * 100 : 0;

    const { data, error } = await supabase
      .from('catalog_products')
      .update({
        retail_price: retailPrice,
        cost_price: costPrice,
        margin: Math.round(margin * 100) / 100, // Round to 2 decimal places
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
   * Update product stock levels
   */
  async updateStockLevels(
    id: string,
    minStockLevel: number,
    reorderQuantity: number | null
  ): Promise<CatalogProductRow> {
    const { data, error } = await supabase
      .from('catalog_products')
      .update({
        min_stock_level: minStockLevel,
        reorder_quantity: reorderQuantity,
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
   * Get distinct product categories for a store
   */
  async getCategories(storeId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('category')
      .eq('store_id', storeId)
      .eq('is_deleted', false);

    if (error) throw error;

    // Get unique categories
    const categories = new Set<string>();
    data?.forEach((row) => categories.add(row.category));
    return Array.from(categories).sort();
  },

  /**
   * Get distinct product brands for a store
   */
  async getBrands(storeId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('brand')
      .eq('store_id', storeId)
      .eq('is_deleted', false);

    if (error) throw error;

    // Get unique brands
    const brands = new Set<string>();
    data?.forEach((row) => brands.add(row.brand));
    return Array.from(brands).sort();
  },

  /**
   * Activate a product
   */
  async activate(id: string): Promise<CatalogProductRow> {
    const { data, error } = await supabase
      .from('catalog_products')
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
   * Deactivate a product
   */
  async deactivate(id: string): Promise<CatalogProductRow> {
    const { data, error } = await supabase
      .from('catalog_products')
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
};
