/**
 * Audited Data Service
 *
 * Phase 0 - Hybrid Auto-Logging (Service Wrapper Layer)
 *
 * A proxy wrapper around dataService that automatically logs all
 * create/update/delete operations with full user context.
 *
 * Benefits:
 * - Rich context (userId, userName, storeId, platform)
 * - Automatic old/new data tracking
 * - No changes needed in Redux slices for basic CRUD
 * - Works alongside database triggers (safety net layer)
 */

import { dataService } from './dataService';
import { auditLogger } from './audit/auditLogger';
import type { AuditEntityType } from './audit/auditLogger';
import type { Client, Staff, Appointment, Ticket, Transaction } from '@/types';

// ============================================================================
// WRAPPER FACTORY
// ============================================================================

/**
 * Create an audited version of a service's CRUD operations
 * Automatically logs create/update/delete with full context
 */
function createAuditedService<T extends { id: string }>(
  entityType: AuditEntityType,
  originalService: {
    getById: (id: string) => Promise<T | null>;
    create: (data: any) => Promise<T>;
    update: (id: string, data: any) => Promise<T | null>;
    delete: (id: string) => Promise<void>;
    [key: string]: any;
  }
) {
  return {
    // Pass through all original methods
    ...originalService,

    /**
     * Audited create - logs after successful creation
     */
    async create(data: any): Promise<T> {
      const result = await originalService.create(data);

      // Log the creation (async, non-blocking)
      auditLogger.logCreate(entityType, result.id, result).catch((err) => {
        console.warn(`[AuditedDataService] Failed to log ${entityType} create:`, err);
      });

      return result;
    },

    /**
     * Audited update - captures old data and logs after update
     */
    async update(id: string, updates: Partial<T>): Promise<T | null> {
      // Capture old data before update
      const oldData = await originalService.getById(id);

      // Perform the update
      const result = await originalService.update(id, updates);

      // Log the update if successful (async, non-blocking)
      if (result && oldData) {
        auditLogger.logUpdate(entityType, id, oldData as Record<string, any>, result as Record<string, any>).catch((err) => {
          console.warn(`[AuditedDataService] Failed to log ${entityType} update:`, err);
        });
      }

      return result;
    },

    /**
     * Audited delete - captures old data and logs after deletion
     */
    async delete(id: string): Promise<void> {
      // Capture old data before delete
      const oldData = await originalService.getById(id);

      // Perform the delete
      await originalService.delete(id);

      // Log the deletion (async, non-blocking)
      if (oldData) {
        auditLogger.logDelete(entityType, id, oldData as Record<string, any>).catch((err) => {
          console.warn(`[AuditedDataService] Failed to log ${entityType} delete:`, err);
        });
      }
    },
  };
}

// ============================================================================
// AUDITED ENTITY SERVICES
// ============================================================================

/**
 * Audited clients service
 * All CRUD operations are automatically logged
 */
export const auditedClientsService = createAuditedService<Client>(
  'client',
  dataService.clients
);

/**
 * Audited staff service
 * All CRUD operations are automatically logged
 */
export const auditedStaffService = createAuditedService<Staff>(
  'staff',
  dataService.staff
);

/**
 * Audited appointments service
 * All CRUD operations are automatically logged
 */
export const auditedAppointmentsService = createAuditedService<Appointment>(
  'appointment',
  dataService.appointments
);

/**
 * Audited tickets service
 * All CRUD operations are automatically logged
 */
export const auditedTicketsService = createAuditedService<Ticket>(
  'ticket',
  dataService.tickets
);

/**
 * Audited transactions service
 * All CRUD operations are automatically logged
 */
export const auditedTransactionsService = createAuditedService<Transaction>(
  'transaction',
  dataService.transactions
);

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Audited Data Service
 *
 * Drop-in replacement for dataService with automatic audit logging.
 * Use this instead of dataService when you want automatic CRUD logging.
 *
 * Usage:
 * ```typescript
 * // Instead of:
 * import { dataService } from '@/services/dataService';
 * await dataService.clients.create(data);
 *
 * // Use:
 * import { auditedDataService } from '@/services/auditedDataService';
 * await auditedDataService.clients.create(data);
 * ```
 */
export const auditedDataService = {
  // Audited CRUD services (create/update/delete are logged)
  clients: auditedClientsService,
  staff: auditedStaffService,
  appointments: auditedAppointmentsService,
  tickets: auditedTicketsService,
  transactions: auditedTransactionsService,

  // Pass through services that don't need auditing
  // (services are read-only in POS, managed via Admin portal)
  services: dataService.services,

  // Utility functions (pass through)
  execute: dataService.execute,
  write: dataService.write,
  shouldUseLocalDB: dataService.shouldUseLocalDB,
  shouldUseServer: dataService.shouldUseServer,
  shouldSync: dataService.shouldSync,
  getModeInfo: dataService.getModeInfo,
  getDataSource: dataService.getDataSource,
  getStoreId: dataService.getStoreId,
};

export default auditedDataService;
