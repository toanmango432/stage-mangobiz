/**
 * Client Package Types (Pre-Paid Service Bundles)
 * PRD Reference: PRD-API-Specifications.md Section 4.9
 *
 * Service packages allow clients to pre-purchase bundles of services
 * at a discount (e.g., "10 Blowout Package").
 *
 * Note: ServicePackage (menu/catalog definition) is in catalog.ts
 * This file defines client-owned packages and usage tracking.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Status of a client's purchased package */
export type ClientPackageStatus = 'active' | 'expired' | 'depleted';

// ============================================
// PACKAGE USAGE RECORD
// ============================================

/**
 * Record of a single session/service redemption from a package.
 */
export interface PackageUsage {
  /** Unique identifier for this usage */
  id: string;

  /** Date of service */
  date: string;

  /** Service that was redeemed */
  serviceId: string;

  /** Service name (denormalized) */
  serviceName?: string;

  /** Staff member who provided the service */
  staffId: string;

  /** Staff name (denormalized) */
  staffName?: string;

  /** Associated ticket ID */
  ticketId: string;

  /** Appointment ID (if booked in advance) */
  appointmentId?: string;

  /** Notes about this usage */
  notes?: string;
}

// ============================================
// CLIENT PACKAGE ENTITY
// ============================================

/**
 * A package purchased by a client.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface ClientPackage extends BaseSyncableEntity {
  /** Reference to the client */
  clientId: string;

  /** Client name (denormalized) */
  clientName?: string;

  /** Reference to the service package definition */
  packageId: string;

  /** Package name (denormalized) */
  packageName?: string;

  /** When the package was purchased */
  purchaseDate: string;

  /** When the package expires */
  expirationDate: string;

  /** Total sessions in the package */
  totalSessions: number;

  /** Number of sessions used */
  sessionsUsed: number;

  /** Number of sessions remaining */
  sessionsRemaining: number;

  /** Current status */
  status: ClientPackageStatus;

  /** Ticket ID from purchase transaction */
  purchaseTicketId: string;

  /** Amount paid for the package */
  amountPaid: number;

  /** Regular price if bought individually */
  regularValue: number;

  /** Savings amount (regularValue - amountPaid) */
  savingsAmount: number;

  /** History of all usages */
  usageHistory: PackageUsage[];

  /** If transferred, original owner client ID */
  transferredFrom?: string;

  /** If transferred, date of transfer */
  transferredAt?: string;
}

// ============================================
// PREPAID PACKAGE DEFINITION
// ============================================

/**
 * Definition of a prepaid service package available for purchase.
 * This extends the catalog ServicePackage with sales-specific fields.
 */
export interface PrepaidPackage extends BaseSyncableEntity {
  /** Package name (e.g., "10 Blowout Package") */
  name: string;

  /** Detailed description */
  description: string;

  /** Services that can be redeemed */
  serviceIds: string[];

  /** Service names (denormalized) */
  serviceNames?: string[];

  /** Total number of sessions in the package */
  totalSessions: number;

  /** Selling price of the package */
  price: number;

  /** Regular price if bought individually */
  regularPrice: number;

  /** Savings amount (calculated) */
  savingsAmount: number;

  /** Savings percentage (calculated) */
  savingsPercent?: number;

  /** Number of days the package is valid */
  validityDays: number;

  /** Whether the package is currently for sale */
  isActive: boolean;

  /** Whether unused sessions can be transferred to another client */
  isTransferable: boolean;

  /** Whether package can be extended (for a fee) */
  isExtendable?: boolean;

  /** Fee to extend the package (if extendable) */
  extensionFee?: number;

  /** Days to extend by (if extendable) */
  extensionDays?: number;

  /** Maximum number of packages a client can have active */
  maxActivePerClient?: number;

  /** Display order in package list */
  sortOrder?: number;

  /** Image URL for display */
  imageUrl?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for selling a package to a client.
 */
export interface SellPackageInput {
  clientId: string;
  packageId: string;
  ticketId: string;
  amountPaid: number;
  customExpirationDate?: string; // Override default validity
}

/**
 * Input for redeeming a session from a package.
 */
export interface RedeemPackageSessionInput {
  clientPackageId: string;
  serviceId: string;
  staffId: string;
  ticketId: string;
  appointmentId?: string;
  notes?: string;
}

/**
 * Input for transferring a package to another client.
 */
export interface TransferPackageInput {
  clientPackageId: string;
  newClientId: string;
  reason?: string;
}

/**
 * Input for extending a package expiration.
 */
export interface ExtendPackageInput {
  clientPackageId: string;
  newExpirationDate: string;
  extensionFee?: number;
  ticketId?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets status display info for a client package.
 */
export function getClientPackageStatusInfo(status: ClientPackageStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    case 'expired':
      return { label: 'Expired', color: 'text-amber-700', bgColor: 'bg-amber-100' };
    case 'depleted':
      return { label: 'Fully Used', color: 'text-gray-700', bgColor: 'bg-gray-100' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }
}

/**
 * Checks if a client package can be used.
 */
export function canRedeemPackage(clientPackage: ClientPackage): {
  canRedeem: boolean;
  reason?: string;
} {
  if (clientPackage.status !== 'active') {
    return { canRedeem: false, reason: `Package is ${clientPackage.status}` };
  }

  if (clientPackage.sessionsRemaining <= 0) {
    return { canRedeem: false, reason: 'No sessions remaining' };
  }

  if (new Date(clientPackage.expirationDate) < new Date()) {
    return { canRedeem: false, reason: 'Package has expired' };
  }

  return { canRedeem: true };
}

/**
 * Calculates the expiration date based on validity days.
 */
export function calculatePackageExpiration(validityDays: number, purchaseDate?: string): string {
  const start = purchaseDate ? new Date(purchaseDate) : new Date();
  const expiration = new Date(start);
  expiration.setDate(expiration.getDate() + validityDays);
  return expiration.toISOString();
}

/**
 * Calculates savings percentage.
 */
export function calculateSavingsPercent(regularPrice: number, salePrice: number): number {
  if (regularPrice <= 0) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

/**
 * Formats package value display.
 */
export function formatPackageValue(pkg: PrepaidPackage): string {
  const perSession = pkg.price / pkg.totalSessions;
  const savings = calculateSavingsPercent(pkg.regularPrice, pkg.price);

  return `$${perSession.toFixed(2)}/session (Save ${savings}%)`;
}
