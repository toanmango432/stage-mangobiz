/**
 * Product Type Adapter (Catalog Products)
 *
 * Converts between Supabase CatalogProductRow and app Product types.
 * Handles snake_case to camelCase conversion and JSON parsing.
 *
 * Note: This uses the catalog_products table, not to be confused with
 * other product-related tables in the system.
 */

import type {
  SyncStatus,
  CatalogProductRow,
  CatalogProductInsert,
  CatalogProductUpdate,
} from '../types';
import type { Product } from '@/types/inventory';
import type { VectorClock } from '@/types/common';

/**
 * Parse vector clock from JSONB
 */
function parseVectorClock(json: unknown): VectorClock {
  if (!json || typeof json !== 'object') {
    return {};
  }
  return json as VectorClock;
}

/**
 * Convert Supabase CatalogProductRow to app Product type
 */
export function toProduct(row: CatalogProductRow): Product {
  return {
    // Primary key
    id: row.id,

    // Multi-tenant isolation
    tenantId: row.tenant_id,
    storeId: row.store_id,
    locationId: row.location_id || undefined,

    // Identifiers
    sku: row.sku,
    barcode: row.barcode || undefined,

    // Core fields
    name: row.name,
    brand: row.brand,
    category: row.category,
    description: row.description || undefined,

    // Pricing
    retailPrice: row.retail_price,
    costPrice: row.cost_price,
    margin: row.margin,

    // Product type
    isRetail: row.is_retail,
    isBackbar: row.is_backbar,

    // Inventory management
    minStockLevel: row.min_stock_level,
    reorderQuantity: row.reorder_quantity ?? undefined,

    // Supplier
    supplierId: row.supplier_id || undefined,
    supplierName: row.supplier_name || undefined,

    // Visual
    imageUrl: row.image_url || undefined,

    // Size/unit
    size: row.size || undefined,
    backbarUnit: row.backbar_unit || undefined,
    backbarUsesPerUnit: row.backbar_uses_per_unit ?? undefined,

    // Status
    isActive: row.is_active,
    isTaxExempt: row.is_tax_exempt,

    // Commission
    commissionRate: row.commission_rate ?? undefined,

    // Sync metadata
    syncStatus: row.sync_status as SyncStatus,
    version: row.version,
    vectorClock: parseVectorClock(row.vector_clock),
    lastSyncedVersion: row.last_synced_version,

    // Timestamps
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // Audit trail
    createdBy: row.created_by || '',
    createdByDevice: row.created_by_device || '',
    lastModifiedBy: row.last_modified_by || '',
    lastModifiedByDevice: row.last_modified_by_device || '',

    // Soft delete
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at || undefined,
    deletedBy: row.deleted_by || undefined,
    deletedByDevice: row.deleted_by_device || undefined,
    tombstoneExpiresAt: row.tombstone_expires_at || undefined,
  };
}

/**
 * Input type for creating a new Product
 */
type CreateProductInput = Omit<Product,
  | 'id'
  | 'tenantId'
  | 'storeId'
  | 'locationId'
  | 'syncStatus'
  | 'version'
  | 'vectorClock'
  | 'lastSyncedVersion'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'createdByDevice'
  | 'lastModifiedBy'
  | 'lastModifiedByDevice'
  | 'isDeleted'
  | 'deletedAt'
  | 'deletedBy'
  | 'deletedByDevice'
  | 'tombstoneExpiresAt'
>;

/**
 * Convert app Product to Supabase CatalogProductInsert
 */
export function toProductInsert(
  product: CreateProductInput,
  storeId: string,
  tenantId: string,
  userId?: string,
  deviceId?: string
): CatalogProductInsert {
  const now = new Date().toISOString();
  const initialVectorClock = deviceId ? { [deviceId]: 1 } : {};

  return {
    tenant_id: tenantId,
    store_id: storeId,
    location_id: null,

    // Identifiers
    sku: product.sku,
    barcode: product.barcode || null,

    // Core fields
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description || null,

    // Pricing
    retail_price: product.retailPrice,
    cost_price: product.costPrice,
    margin: product.margin,

    // Product type
    is_retail: product.isRetail,
    is_backbar: product.isBackbar,

    // Inventory management
    min_stock_level: product.minStockLevel,
    reorder_quantity: product.reorderQuantity ?? null,

    // Supplier
    supplier_id: product.supplierId || null,
    supplier_name: product.supplierName || null,

    // Visual
    image_url: product.imageUrl || null,

    // Size/unit
    size: product.size || null,
    backbar_unit: product.backbarUnit || null,
    backbar_uses_per_unit: product.backbarUsesPerUnit ?? null,

    // Status
    is_active: product.isActive,
    is_tax_exempt: product.isTaxExempt ?? false,

    // Commission
    commission_rate: product.commissionRate ?? null,

    // Sync metadata
    sync_status: 'local',
    version: 1,
    vector_clock: initialVectorClock,
    last_synced_version: 0,

    // Timestamps
    created_at: now,
    updated_at: now,

    // Audit trail
    created_by: userId || null,
    created_by_device: deviceId || null,
    last_modified_by: userId || null,
    last_modified_by_device: deviceId || null,

    // Soft delete
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    deleted_by_device: null,
    tombstone_expires_at: null,
  };
}

/**
 * Convert partial Product updates to Supabase CatalogProductUpdate
 */
export function toProductUpdate(
  updates: Partial<Product>,
  userId?: string,
  deviceId?: string
): CatalogProductUpdate {
  const result: CatalogProductUpdate = {};

  // Identifiers
  if (updates.sku !== undefined) {
    result.sku = updates.sku;
  }
  if (updates.barcode !== undefined) {
    result.barcode = updates.barcode || null;
  }

  // Core fields
  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.brand !== undefined) {
    result.brand = updates.brand;
  }
  if (updates.category !== undefined) {
    result.category = updates.category;
  }
  if (updates.description !== undefined) {
    result.description = updates.description || null;
  }

  // Pricing
  if (updates.retailPrice !== undefined) {
    result.retail_price = updates.retailPrice;
  }
  if (updates.costPrice !== undefined) {
    result.cost_price = updates.costPrice;
  }
  if (updates.margin !== undefined) {
    result.margin = updates.margin;
  }

  // Product type
  if (updates.isRetail !== undefined) {
    result.is_retail = updates.isRetail;
  }
  if (updates.isBackbar !== undefined) {
    result.is_backbar = updates.isBackbar;
  }

  // Inventory management
  if (updates.minStockLevel !== undefined) {
    result.min_stock_level = updates.minStockLevel;
  }
  if (updates.reorderQuantity !== undefined) {
    result.reorder_quantity = updates.reorderQuantity ?? null;
  }

  // Supplier
  if (updates.supplierId !== undefined) {
    result.supplier_id = updates.supplierId || null;
  }
  if (updates.supplierName !== undefined) {
    result.supplier_name = updates.supplierName || null;
  }

  // Visual
  if (updates.imageUrl !== undefined) {
    result.image_url = updates.imageUrl || null;
  }

  // Size/unit
  if (updates.size !== undefined) {
    result.size = updates.size || null;
  }
  if (updates.backbarUnit !== undefined) {
    result.backbar_unit = updates.backbarUnit || null;
  }
  if (updates.backbarUsesPerUnit !== undefined) {
    result.backbar_uses_per_unit = updates.backbarUsesPerUnit ?? null;
  }

  // Status
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
  }
  if (updates.isTaxExempt !== undefined) {
    result.is_tax_exempt = updates.isTaxExempt;
  }

  // Commission
  if (updates.commissionRate !== undefined) {
    result.commission_rate = updates.commissionRate ?? null;
  }

  // Sync metadata
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus as SyncStatus;
  }
  if (updates.version !== undefined) {
    result.version = updates.version;
  }
  if (updates.vectorClock !== undefined) {
    result.vector_clock = updates.vectorClock;
  }
  if (updates.lastSyncedVersion !== undefined) {
    result.last_synced_version = updates.lastSyncedVersion;
  }

  // Soft delete
  if (updates.isDeleted !== undefined) {
    result.is_deleted = updates.isDeleted;
  }
  if (updates.deletedAt !== undefined) {
    result.deleted_at = updates.deletedAt || null;
  }
  if (updates.deletedBy !== undefined) {
    result.deleted_by = updates.deletedBy || null;
  }
  if (updates.deletedByDevice !== undefined) {
    result.deleted_by_device = updates.deletedByDevice || null;
  }
  if (updates.tombstoneExpiresAt !== undefined) {
    result.tombstone_expires_at = updates.tombstoneExpiresAt || null;
  }

  // Always update modified metadata and timestamp
  result.updated_at = new Date().toISOString();
  if (userId) {
    result.last_modified_by = userId;
  }
  if (deviceId) {
    result.last_modified_by_device = deviceId;
  }

  return result;
}

/**
 * Convert array of CatalogProductRows to Products
 */
export function toProducts(rows: CatalogProductRow[]): Product[] {
  return rows.map(toProduct);
}
