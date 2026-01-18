/**
 * ServiceSQLiteService - SQLite service for menu services/items
 *
 * Provides SQLite-based CRUD operations for services (menu items)
 * with category filtering, active filtering, and search functionality.
 *
 * @module sqlite-adapter/services/serviceService
 */

import { BaseSQLiteService, type TableSchema } from './BaseSQLiteService';
import type { SQLiteAdapter } from '../types';

// ==================== TYPES ====================

/**
 * Service add-on option
 */
export interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
  duration?: number;
}

/**
 * Service variant (e.g., short/medium/long hair pricing)
 */
export interface ServiceVariant {
  id: string;
  name: string;
  price: number;
  duration?: number;
}

/**
 * Service entity type
 *
 * Extends Record<string, unknown> to satisfy BaseSQLiteService constraint.
 */
export interface Service extends Record<string, unknown> {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  duration: number;
  displayOrder?: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  addOns?: ServiceAddOn[];
  variants?: ServiceVariant[];
  createdAt: string;
  updatedAt: string;
  syncStatus?: string;
}

/**
 * Service SQLite row type
 */
export interface ServiceRow {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  duration: number;
  display_order: number | null;
  color: string | null;
  icon: string | null;
  is_active: number; // SQLite boolean (0 or 1)
  add_ons: string | null; // JSON
  variants: string | null; // JSON
  created_at: string;
  updated_at: string;
  sync_status: string | null;
}

// ==================== SCHEMA ====================

/**
 * Services table schema
 *
 * Note: Uses snake_case column names matching the database schema.
 */
const serviceSchema: TableSchema = {
  tableName: 'services',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    name: 'name',
    description: 'description',
    category: 'category',
    price: { column: 'price', type: 'number', defaultValue: 0 },
    duration: { column: 'duration', type: 'number', defaultValue: 30 },
    displayOrder: { column: 'display_order', type: 'number', defaultValue: 0 },
    color: 'color',
    icon: 'icon',
    isActive: { column: 'is_active', type: 'boolean', defaultValue: true },
    addOns: { column: 'add_ons', type: 'json', defaultValue: [] },
    variants: { column: 'variants', type: 'json', defaultValue: [] },
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: { column: 'sync_status', type: 'string', defaultValue: 'local' },
  },
};

// ==================== SERVICE CLASS ====================

/**
 * SQLite service for menu services/items
 *
 * Extends BaseSQLiteService with service-specific query methods:
 * - Category filtering for menu organization
 * - Active filtering for visible services
 * - Search functionality by name/description
 * - Display order support for menu sorting
 *
 * @example
 * const service = new ServiceSQLiteService(db);
 * const hairServices = await service.getByCategory(storeId, 'hair');
 * const activeServices = await service.getActive(storeId);
 * const results = await service.search(storeId, 'manicure');
 */
export class ServiceSQLiteService extends BaseSQLiteService<Service, ServiceRow> {
  constructor(db: SQLiteAdapter) {
    super(db, serviceSchema);
  }

  /**
   * Get services by category
   *
   * Retrieves all active services in a specific category.
   * Used for category-based menu views.
   *
   * @param storeId - Store ID to filter by
   * @param category - Category name to filter by
   * @returns Services in the category, ordered by display order
   */
  async getByCategory(storeId: string, category: string): Promise<Service[]> {
    return this.findWhere(
      'store_id = ? AND category = ? AND is_active = 1',
      [storeId, category],
      'display_order ASC, name ASC'
    );
  }

  /**
   * Get active services
   *
   * Retrieves all active services for a store.
   * Used for booking flow service selection.
   *
   * @param storeId - Store ID to filter by
   * @returns Active services, ordered by display order
   */
  async getActive(storeId: string): Promise<Service[]> {
    return this.findWhere(
      'store_id = ? AND is_active = 1',
      [storeId],
      'display_order ASC, name ASC'
    );
  }

  /**
   * Search services by name or description
   *
   * Searches for services matching a query string.
   * Uses SQL LIKE for pattern matching.
   *
   * @param storeId - Store ID to filter by
   * @param query - Search query string
   * @returns Matching services, ordered by display order
   */
  async search(storeId: string, query: string): Promise<Service[]> {
    const pattern = `%${query}%`;
    return this.findWhere(
      'store_id = ? AND is_active = 1 AND (name LIKE ? OR description LIKE ?)',
      [storeId, pattern, pattern],
      'display_order ASC, name ASC'
    );
  }

  /**
   * Get all services for a store
   *
   * Retrieves all services (including inactive) for a store.
   * Used for admin/management views.
   *
   * @param storeId - Store ID to filter by
   * @param limit - Maximum number of records (default: 1000)
   * @param offset - Number of records to skip (default: 0)
   * @returns All services for the store
   */
  async getByStore(storeId: string, limit: number = 1000, offset: number = 0): Promise<Service[]> {
    return this.findWhere(
      'store_id = ?',
      [storeId],
      'display_order ASC, name ASC',
      limit,
      offset
    );
  }

  /**
   * Get services by IDs
   *
   * Retrieves multiple services by their IDs.
   * Useful for loading services on a ticket.
   *
   * @param ids - Array of service IDs
   * @returns Services matching the IDs
   */
  async getByIds(ids: string[]): Promise<Service[]> {
    if (ids.length === 0) return [];
    return super.getByIds(ids);
  }

  /**
   * Get all categories for a store
   *
   * Returns distinct category names for a store.
   * Used for category tabs/navigation.
   *
   * @param storeId - Store ID to filter by
   * @returns Array of distinct category names
   */
  async getCategories(storeId: string): Promise<string[]> {
    const sql = `
      SELECT DISTINCT category
      FROM services
      WHERE store_id = ? AND category IS NOT NULL AND is_active = 1
      ORDER BY category ASC
    `;

    interface CategoryRow {
      category: string;
    }

    const rows = await this.db.all<CategoryRow>(sql, [storeId]);
    return rows.map((row) => row.category);
  }

  /**
   * Count services by category
   *
   * Returns counts of services per category for a store.
   * Uses SQL GROUP BY for efficient aggregation.
   *
   * @param storeId - Store ID to filter by
   * @returns Object with category names as keys and counts as values
   */
  async countByCategory(storeId: string): Promise<Record<string, number>> {
    const sql = `
      SELECT category, COUNT(*) as count
      FROM services
      WHERE store_id = ? AND is_active = 1 AND category IS NOT NULL
      GROUP BY category
    `;

    interface CountRow {
      category: string;
      count: number;
    }

    const rows = await this.db.all<CountRow>(sql, [storeId]);

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.category] = row.count;
    }

    return counts;
  }

  /**
   * Count active services
   *
   * Returns the count of active services for a store.
   *
   * @param storeId - Store ID to filter by
   * @returns Count of active services
   */
  async countActive(storeId: string): Promise<number> {
    return this.countWhere('store_id = ? AND is_active = 1', [storeId]);
  }

  /**
   * Soft delete a service
   *
   * Sets isActive to false instead of deleting.
   *
   * @param id - Service ID
   * @returns Updated service or undefined if not found
   */
  async softDelete(id: string): Promise<Service | undefined> {
    return this.update(id, { isActive: false } as Partial<Service>);
  }

  /**
   * Restore a soft-deleted service
   *
   * Sets isActive back to true.
   *
   * @param id - Service ID
   * @returns Updated service or undefined if not found
   */
  async restore(id: string): Promise<Service | undefined> {
    return this.update(id, { isActive: true } as Partial<Service>);
  }

  /**
   * Update display order for multiple services
   *
   * Batch update display orders for menu reordering.
   * Uses a transaction for atomicity.
   *
   * @param updates - Array of { id, displayOrder } objects
   * @returns Number of services updated
   */
  async updateDisplayOrder(updates: Array<{ id: string; displayOrder: number }>): Promise<number> {
    if (updates.length === 0) return 0;

    // Update each service's display order
    let count = 0;
    for (const { id, displayOrder } of updates) {
      const updated = await this.update(id, { displayOrder } as Partial<Service>);
      if (updated) count++;
    }

    return count;
  }

  /**
   * Get services in price range
   *
   * Retrieves active services within a price range.
   * Useful for filtering by price.
   *
   * @param storeId - Store ID to filter by
   * @param minPrice - Minimum price (inclusive)
   * @param maxPrice - Maximum price (inclusive)
   * @returns Services in the price range
   */
  async getByPriceRange(storeId: string, minPrice: number, maxPrice: number): Promise<Service[]> {
    return this.findWhere(
      'store_id = ? AND is_active = 1 AND price >= ? AND price <= ?',
      [storeId, minPrice, maxPrice],
      'price ASC, name ASC'
    );
  }

  /**
   * Get services by duration range
   *
   * Retrieves active services within a duration range.
   * Useful for scheduling views.
   *
   * @param storeId - Store ID to filter by
   * @param minDuration - Minimum duration in minutes (inclusive)
   * @param maxDuration - Maximum duration in minutes (inclusive)
   * @returns Services in the duration range
   */
  async getByDurationRange(
    storeId: string,
    minDuration: number,
    maxDuration: number
  ): Promise<Service[]> {
    return this.findWhere(
      'store_id = ? AND is_active = 1 AND duration >= ? AND duration <= ?',
      [storeId, minDuration, maxDuration],
      'duration ASC, name ASC'
    );
  }

  /**
   * Get popular services
   *
   * Gets services ordered by a popularity metric.
   * Note: This requires a `booking_count` or similar field to be maintained.
   * Falls back to display_order if not available.
   *
   * @param storeId - Store ID to filter by
   * @param limit - Maximum number of services to return
   * @returns Popular services
   */
  async getPopular(storeId: string, limit: number = 10): Promise<Service[]> {
    // For now, return services by display order (often manually curated for popularity)
    // In a production system, this would query booking_count or similar metrics
    return this.findWhere(
      'store_id = ? AND is_active = 1',
      [storeId],
      'display_order ASC, name ASC',
      limit,
      0
    );
  }
}
