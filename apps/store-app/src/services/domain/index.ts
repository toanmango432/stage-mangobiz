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
export { ticketsService } from './ticketDataService';
export { staffService } from './staffDataService';
export { transactionsService } from './transactionDataService';
export {
  servicesService,
  serviceCategoriesService,
  menuServicesService,
  serviceVariantsService,
  servicePackagesService,
  addOnGroupsService,
  addOnOptionsService,
  staffServiceAssignmentsService,
  catalogSettingsService,
  productsService,
} from './catalogDataService';
export {
  timeOffTypesService,
  timeOffRequestsService,
  blockedTimeTypesService,
  blockedTimeEntriesService,
  businessClosedPeriodsService,
  resourcesService,
  resourceBookingsService,
  staffSchedulesService,
} from './scheduleDataService';
export { syncQueueService } from './syncDataService';
