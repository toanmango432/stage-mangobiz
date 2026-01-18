import { SyncStatus } from './common';

/**
 * Status of a service in the catalog.
 *
 * Following industry best practice (Fresha, Boulevard, Vagaro):
 * - Services are archived, not deleted
 * - Archived services still work for existing appointments
 * - Archived services are hidden from new bookings
 *
 * @example
 * ```typescript
 * // Active service - visible in booking UI, can be added to appointments
 * const haircut: Service = { status: 'active', ... };
 *
 * // Archived service - hidden from booking, but existing appointments still work
 * const discontinuedService: Service = {
 *   status: 'archived',
 *   archivedAt: '2024-01-15T10:30:00Z',
 *   archivedBy: 'staff-123',
 *   ...
 * };
 * ```
 */
export type ServiceStatus = 'active' | 'archived';

export interface Service {
  id: string;
  storeId: string;
  name: string;
  category: string;
  description?: string;
  duration: number; // minutes
  price: number;
  commissionRate: number; // percentage
  isActive: boolean;
  createdAt: string; // ISO string (stored in UTC)
  updatedAt: string; // ISO string (stored in UTC)
  syncStatus: SyncStatus;

  // === ARCHIVE FIELDS ===

  /**
   * Archive status of the service.
   * - 'active': Service is available for new bookings (default)
   * - 'archived': Service is hidden from new bookings but works for existing appointments
   *
   * @default 'active'
   */
  status?: ServiceStatus;

  /**
   * ISO timestamp when the service was archived.
   * Only set when status is 'archived'.
   *
   * @example '2024-01-15T10:30:00.000Z'
   */
  archivedAt?: string;

  /**
   * Staff ID of the person who archived this service.
   * Only set when status is 'archived'.
   *
   * @example 'staff-abc123'
   */
  archivedBy?: string;
}
