import { useLiveQuery } from 'dexie-react-hooks';
import {
  appointmentsDB,
  ticketsDB,
  staffDB,
  clientsDB,
  servicesDB,
  transactionsDB,
  // Catalog
  serviceCategoriesDB,
  menuServicesDB,
  serviceVariantsDB,
  servicePackagesDB,
  addOnGroupsDB,
  addOnOptionsDB,
  staffServiceAssignmentsDB,
  catalogSettingsDB,
} from './database';

// ==================== APPOINTMENTS ====================

export function useAppointments(storeId: string) {
  return useLiveQuery(
    () => appointmentsDB.getAll(storeId),
    [storeId]
  );
}

export function useAppointmentsByDate(storeId: string, date: Date) {
  return useLiveQuery(
    () => appointmentsDB.getByDate(storeId, date),
    [storeId, date.toISOString()]
  );
}

export function useAppointment(id: string | undefined) {
  return useLiveQuery(
    () => id ? appointmentsDB.getById(id) : undefined,
    [id]
  );
}

// ==================== TICKETS ====================

export function useTickets(storeId: string) {
  return useLiveQuery(
    () => ticketsDB.getAll(storeId),
    [storeId]
  );
}

export function useActiveTickets(storeId: string) {
  return useLiveQuery(
    () => ticketsDB.getActive(storeId),
    [storeId]
  );
}

export function useTicketsByStatus(storeId: string, status: string) {
  return useLiveQuery(
    () => ticketsDB.getByStatus(storeId, status),
    [storeId, status]
  );
}

export function useTicket(id: string | undefined) {
  return useLiveQuery(
    () => id ? ticketsDB.getById(id) : undefined,
    [id]
  );
}

// ==================== STAFF ====================

export function useStaff(storeId: string) {
  return useLiveQuery(
    () => staffDB.getAll(storeId),
    [storeId]
  );
}

export function useAvailableStaff(storeId: string) {
  return useLiveQuery(
    () => staffDB.getAvailable(storeId),
    [storeId]
  );
}

export function useStaffMember(id: string | undefined) {
  return useLiveQuery(
    () => id ? staffDB.getById(id) : undefined,
    [id]
  );
}

// ==================== CLIENTS ====================

export function useClients(storeId: string) {
  return useLiveQuery(
    () => clientsDB.getAll(storeId),
    [storeId]
  );
}

export function useClient(id: string | undefined) {
  return useLiveQuery(
    () => id ? clientsDB.getById(id) : undefined,
    [id]
  );
}

export function useClientSearch(storeId: string, query: string) {
  return useLiveQuery(
    () => query.length >= 2 ? clientsDB.search(storeId, query) : [],
    [storeId, query]
  );
}

// ==================== SERVICES ====================

export function useServices(storeId: string) {
  return useLiveQuery(
    () => servicesDB.getAll(storeId),
    [storeId]
  );
}

export function useServicesByCategory(storeId: string, category: string) {
  return useLiveQuery(
    () => servicesDB.getByCategory(storeId, category),
    [storeId, category]
  );
}

// ==================== TRANSACTIONS ====================

export function useTransactions(storeId: string) {
  return useLiveQuery(
    () => transactionsDB.getAll(storeId),
    [storeId]
  );
}

export function useTransactionsByDateRange(storeId: string, startDate: Date, endDate: Date) {
  return useLiveQuery(
    () => transactionsDB.getByDateRange(storeId, startDate, endDate),
    [storeId, startDate.toISOString(), endDate.toISOString()]
  );
}

export function useTransaction(id: string | undefined) {
  return useLiveQuery(
    () => id ? transactionsDB.getById(id) : undefined,
    [id]
  );
}

// ==================== SERVICE CATEGORIES ====================

export function useServiceCategories(storeId: string, includeInactive = false) {
  return useLiveQuery(
    () => serviceCategoriesDB.getAll(storeId, includeInactive),
    [storeId, includeInactive]
  );
}

export function useServiceCategoriesWithCounts(storeId: string, includeInactive = false) {
  return useLiveQuery(
    () => serviceCategoriesDB.getWithCounts(storeId, includeInactive),
    [storeId, includeInactive]
  );
}

export function useServiceCategory(id: string | undefined) {
  return useLiveQuery(
    () => id ? serviceCategoriesDB.getById(id) : undefined,
    [id]
  );
}

// ==================== MENU SERVICES (Enhanced) ====================

export function useMenuServices(storeId: string, includeInactive = false) {
  return useLiveQuery(
    () => menuServicesDB.getAll(storeId, includeInactive),
    [storeId, includeInactive]
  );
}

export function useMenuServicesByCategory(storeId: string, categoryId: string, includeInactive = false) {
  return useLiveQuery(
    () => menuServicesDB.getByCategory(storeId, categoryId, includeInactive),
    [storeId, categoryId, includeInactive]
  );
}

export function useMenuService(id: string | undefined) {
  return useLiveQuery(
    () => id ? menuServicesDB.getById(id) : undefined,
    [id]
  );
}

export function useMenuServiceWithVariants(id: string | undefined) {
  return useLiveQuery(
    () => id ? menuServicesDB.getWithVariants(id) : undefined,
    [id]
  );
}

export function useMenuServiceSearch(storeId: string, query: string) {
  return useLiveQuery(
    () => query.length >= 2 ? menuServicesDB.search(storeId, query) : [],
    [storeId, query]
  );
}

// ==================== SERVICE VARIANTS ====================

export function useServiceVariants(serviceId: string, includeInactive = false) {
  return useLiveQuery(
    () => serviceVariantsDB.getByService(serviceId, includeInactive),
    [serviceId, includeInactive]
  );
}

export function useServiceVariant(id: string | undefined) {
  return useLiveQuery(
    () => id ? serviceVariantsDB.getById(id) : undefined,
    [id]
  );
}

// ==================== SERVICE PACKAGES ====================

export function useServicePackages(storeId: string, includeInactive = false) {
  return useLiveQuery(
    () => servicePackagesDB.getAll(storeId, includeInactive),
    [storeId, includeInactive]
  );
}

export function useServicePackage(id: string | undefined) {
  return useLiveQuery(
    () => id ? servicePackagesDB.getById(id) : undefined,
    [id]
  );
}

// ==================== ADD-ON GROUPS ====================

export function useAddOnGroups(storeId: string, includeInactive = false) {
  return useLiveQuery(
    () => addOnGroupsDB.getAll(storeId, includeInactive),
    [storeId, includeInactive]
  );
}

export function useAddOnGroupsWithOptions(storeId: string, includeInactive = false) {
  return useLiveQuery(
    () => addOnGroupsDB.getAllWithOptions(storeId, includeInactive),
    [storeId, includeInactive]
  );
}

export function useAddOnGroup(id: string | undefined) {
  return useLiveQuery(
    () => id ? addOnGroupsDB.getById(id) : undefined,
    [id]
  );
}

export function useAddOnGroupWithOptions(id: string | undefined) {
  return useLiveQuery(
    () => id ? addOnGroupsDB.getWithOptions(id) : undefined,
    [id]
  );
}

export function useAddOnsForService(storeId: string, serviceId: string, categoryId: string) {
  return useLiveQuery(
    () => addOnGroupsDB.getForService(storeId, serviceId, categoryId),
    [storeId, serviceId, categoryId]
  );
}

// ==================== ADD-ON OPTIONS ====================

export function useAddOnOptions(groupId: string, includeInactive = false) {
  return useLiveQuery(
    () => addOnOptionsDB.getByGroup(groupId, includeInactive),
    [groupId, includeInactive]
  );
}

export function useAddOnOption(id: string | undefined) {
  return useLiveQuery(
    () => id ? addOnOptionsDB.getById(id) : undefined,
    [id]
  );
}

// ==================== STAFF-SERVICE ASSIGNMENTS ====================

export function useStaffServiceAssignmentsByStaff(storeId: string, staffId: string) {
  return useLiveQuery(
    () => staffServiceAssignmentsDB.getByStaff(storeId, staffId),
    [storeId, staffId]
  );
}

export function useStaffServiceAssignmentsByService(storeId: string, serviceId: string) {
  return useLiveQuery(
    () => staffServiceAssignmentsDB.getByService(storeId, serviceId),
    [storeId, serviceId]
  );
}

// ==================== CATALOG SETTINGS ====================

export function useCatalogSettings(storeId: string) {
  return useLiveQuery(
    () => catalogSettingsDB.get(storeId),
    [storeId]
  );
}
