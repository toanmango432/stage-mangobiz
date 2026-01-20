/**
 * Domain Services
 *
 * Barrel export for domain-specific data services.
 * These services were extracted from the main dataService.ts
 * to improve modularity and maintainability.
 *
 * The main dataService.ts facade imports and re-exports these
 * services for backward compatibility.
 */

export { appointmentsService } from './appointmentDataService';
export { clientsService } from './clientDataService';
