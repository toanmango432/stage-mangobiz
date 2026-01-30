/**
 * Inventory Types
 * PRD Reference: PRD-API-Specifications.md Section 4.10
 *
 * Inventory management for retail products and backbar supplies,
 * including stock tracking, purchase orders, and supplier management.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Product usage type */
export type ProductType = 'retail' | 'backbar' | 'both';

/** Stock adjustment reason */
export type StockAdjustmentReason =
  | 'sale'
  | 'return'
  | 'count'           // Physical inventory count
  | 'shrinkage'       // Loss, theft, damage
  | 'backbar-usage'   // Used during service
  | 'transfer'        // Transfer between locations
  | 'received'        // Received from PO
  | 'adjustment';     // Manual adjustment

/** Purchase order status */
export type PurchaseOrderStatus =
  | 'draft'
  | 'ordered'
  | 'partial'      // Partially received
  | 'received'     // Fully received
  | 'cancelled';

// ============================================
// SUPPLIER ENTITY
// ============================================

/**
 * A product supplier/vendor.
 */
export interface Supplier extends BaseSyncableEntity {
  /** Supplier company name */
  name: string;

  /** Contact person name */
  contactName?: string;

  /** Contact email */
  email?: string;

  /** Contact phone */
  phone?: string;

  /** Business address */
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  /** Website URL */
  website?: string;

  /** Account number with supplier */
  accountNumber?: string;

  /** Payment terms (e.g., "Net 30") */
  paymentTerms?: string;

  /** Minimum order amount */
  minimumOrderAmount?: number;

  /** Lead time in days */
  leadTimeDays?: number;

  /** Notes about the supplier */
  notes?: string;

  /** Whether supplier is active */
  isActive: boolean;
}

// ============================================
// PRODUCT ENTITY
// ============================================

/**
 * A product in inventory (retail or backbar).
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Product extends BaseSyncableEntity {
  /** Stock Keeping Unit */
  sku: string;

  /** Barcode (UPC, EAN, etc.) */
  barcode?: string;

  /** Product name */
  name: string;

  /** Brand name */
  brand: string;

  /** Product category */
  category: string;

  /** Detailed description */
  description?: string;

  /** Retail selling price */
  retailPrice: number;

  /** Wholesale/cost price */
  costPrice: number;

  /** Profit margin percentage (calculated) */
  margin: number;

  /** Whether sold to clients */
  isRetail: boolean;

  /** Whether used during services */
  isBackbar: boolean;

  /** Minimum stock level (for low stock alerts) */
  minStockLevel: number;

  /** Reorder quantity (suggested order amount) */
  reorderQuantity?: number;

  /** Supplier ID */
  supplierId?: string;

  /** Supplier name (denormalized) */
  supplierName?: string;

  /** Product image URL */
  imageUrl?: string;

  /** Size/volume (e.g., "8 oz", "250ml") */
  size?: string;

  /** Unit of measure for backbar (e.g., "oz", "ml") */
  backbarUnit?: string;

  /** Estimated backbar uses per unit */
  backbarUsesPerUnit?: number;

  /** Whether product is active */
  isActive: boolean;

  /** Tax exempt */
  isTaxExempt?: boolean;

  /** Commission rate for staff (percentage) */
  commissionRate?: number;
}

// ============================================
// INVENTORY LEVEL
// ============================================

/**
 * Stock levels for a product at a specific location.
 */
export interface InventoryLevel {
  /** Product ID */
  productId: string;

  /** Product name (denormalized) */
  productName?: string;

  /** Location ID */
  locationId: string;

  /** Quantity physically in stock */
  quantityOnHand: number;

  /** Quantity reserved (for pending orders/sales) */
  quantityReserved: number;

  /** Available for sale (onHand - reserved) */
  quantityAvailable: number;

  /** Quantity on order (in purchase orders) */
  quantityOnOrder?: number;

  /** Last physical count date */
  lastCountDate?: string;

  /** Last counted quantity */
  lastCountQuantity?: number;

  /** Last restock date */
  lastRestockDate?: string;

  /** Whether below minimum level */
  isBelowMin?: boolean;
}

// ============================================
// STOCK ADJUSTMENT
// ============================================

/**
 * Record of a stock level change.
 */
export interface StockAdjustment extends BaseSyncableEntity {
  /** Product ID */
  productId: string;

  /** Location ID */
  locationId: string;

  /** Reason for adjustment */
  reason: StockAdjustmentReason;

  /** Quantity changed (positive for increase, negative for decrease) */
  quantityChange: number;

  /** Stock level before adjustment */
  previousQuantity: number;

  /** Stock level after adjustment */
  newQuantity: number;

  /** Associated transaction (for sales/returns) */
  ticketId?: string;

  /** Associated purchase order (for received) */
  purchaseOrderId?: string;

  /** Transfer destination location (for transfers) */
  transferToLocationId?: string;

  /** Notes about the adjustment */
  notes?: string;

  /** Staff who made the adjustment */
  adjustedBy: string;
}

// ============================================
// PURCHASE ORDER
// ============================================

/**
 * Line item in a purchase order.
 */
export interface PurchaseOrderItem {
  /** Unique ID within the PO */
  id: string;

  /** Product ID */
  productId: string;

  /** Product name (denormalized) */
  productName: string;

  /** Product SKU (denormalized) */
  sku: string;

  /** Quantity ordered */
  quantityOrdered: number;

  /** Quantity received */
  quantityReceived: number;

  /** Unit cost */
  unitCost: number;

  /** Line total (quantity × unitCost) */
  lineTotal: number;
}

/**
 * A purchase order for restocking inventory.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface PurchaseOrder extends BaseSyncableEntity {
  /** Reference number (e.g., "PO-2025-001") */
  orderNumber: string;

  /** Supplier ID */
  supplierId: string;

  /** Supplier name (denormalized) */
  supplierName: string;

  /** Destination location ID */
  locationId: string;

  /** Current status */
  status: PurchaseOrderStatus;

  /** Line items */
  items: PurchaseOrderItem[];

  /** Subtotal before tax */
  subtotal: number;

  /** Tax amount */
  tax: number;

  /** Shipping cost */
  shipping?: number;

  /** Total amount */
  total: number;

  /** When order was placed with supplier */
  orderedAt?: string;

  /** Expected delivery date */
  expectedDeliveryDate?: string;

  /** When order was received (fully or partially) */
  receivedAt?: string;

  /** Tracking number */
  trackingNumber?: string;

  /** Notes */
  notes?: string;
}

// ============================================
// BACKBAR USAGE LOG
// ============================================

/**
 * Record of backbar product usage during a service.
 */
export interface BackbarUsageLog extends BaseSyncableEntity {
  /** Product ID */
  productId: string;

  /** Product name (denormalized) */
  productName: string;

  /** Location ID */
  locationId: string;

  /** Quantity used */
  quantityUsed: number;

  /** Associated ticket */
  ticketId?: string;

  /** Associated appointment */
  appointmentId?: string;

  /** Staff member who used the product */
  staffId: string;

  /** Staff name (denormalized) */
  staffName?: string;

  /** Service being performed */
  serviceId?: string;

  /** Notes */
  notes?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for creating a product.
 */
export interface CreateProductInput {
  sku: string;
  barcode?: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  retailPrice: number;
  costPrice: number;
  isRetail: boolean;
  isBackbar: boolean;
  minStockLevel: number;
  supplierId?: string;
  imageUrl?: string;
  size?: string;
}

/**
 * Input for adjusting stock.
 */
export interface AdjustStockInput {
  productId: string;
  locationId: string;
  reason: StockAdjustmentReason;
  quantityChange: number;
  notes?: string;
  ticketId?: string;
}

/**
 * Input for creating a purchase order.
 */
export interface CreatePurchaseOrderInput {
  supplierId: string;
  locationId: string;
  items: {
    productId: string;
    quantityOrdered: number;
    unitCost?: number; // Defaults to product cost price
  }[];
  expectedDeliveryDate?: string;
  notes?: string;
}

/**
 * Input for receiving a purchase order.
 */
export interface ReceivePurchaseOrderInput {
  purchaseOrderId: string;
  itemsReceived: {
    itemId: string;
    quantityReceived: number;
  }[];
  notes?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculates profit margin percentage.
 */
export function calculateMargin(retailPrice: number, costPrice: number): number {
  if (retailPrice <= 0) return 0;
  return Math.round(((retailPrice - costPrice) / retailPrice) * 100);
}

/**
 * Generates a purchase order number.
 */
export function generatePONumber(locationPrefix = 'PO'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${locationPrefix}-${year}-${random}`;
}

/**
 * Gets status display info for a purchase order.
 */
export function getPOStatusInfo(status: PurchaseOrderStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'draft':
      return { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    case 'ordered':
      return { label: 'Ordered', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    case 'partial':
      return { label: 'Partial', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    case 'received':
      return { label: 'Received', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Checks if a product is low in stock.
 */
export function isLowStock(level: InventoryLevel, product: Product): boolean {
  return level.quantityAvailable <= product.minStockLevel;
}
