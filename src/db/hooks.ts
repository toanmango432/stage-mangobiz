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

export function useAppointments(salonId: string) {
  return useLiveQuery(
    () => appointmentsDB.getAll(salonId),
    [salonId]
  );
}

export function useAppointmentsByDate(salonId: string, date: Date) {
  return useLiveQuery(
    () => appointmentsDB.getByDate(salonId, date),
    [salonId, date.toISOString()]
  );
}

export function useAppointment(id: string | undefined) {
  return useLiveQuery(
    () => id ? appointmentsDB.getById(id) : undefined,
    [id]
  );
}

// ==================== TICKETS ====================

export function useTickets(salonId: string) {
  return useLiveQuery(
    () => ticketsDB.getAll(salonId),
    [salonId]
  );
}

export function useActiveTickets(salonId: string) {
  return useLiveQuery(
    () => ticketsDB.getActive(salonId),
    [salonId]
  );
}

export function useTicketsByStatus(salonId: string, status: string) {
  return useLiveQuery(
    () => ticketsDB.getByStatus(salonId, status),
    [salonId, status]
  );
}

export function useTicket(id: string | undefined) {
  return useLiveQuery(
    () => id ? ticketsDB.getById(id) : undefined,
    [id]
  );
}

// ==================== STAFF ====================

export function useStaff(salonId: string) {
  return useLiveQuery(
    () => staffDB.getAll(salonId),
    [salonId]
  );
}

export function useAvailableStaff(salonId: string) {
  return useLiveQuery(
    () => staffDB.getAvailable(salonId),
    [salonId]
  );
}

export function useStaffMember(id: string | undefined) {
  return useLiveQuery(
    () => id ? staffDB.getById(id) : undefined,
    [id]
  );
}

// ==================== CLIENTS ====================

export function useClients(salonId: string) {
  return useLiveQuery(
    () => clientsDB.getAll(salonId),
    [salonId]
  );
}

export function useClient(id: string | undefined) {
  return useLiveQuery(
    () => id ? clientsDB.getById(id) : undefined,
    [id]
  );
}

export function useClientSearch(salonId: string, query: string) {
  return useLiveQuery(
    () => query.length >= 2 ? clientsDB.search(salonId, query) : [],
    [salonId, query]
  );
}

// ==================== SERVICES ====================

export function useServices(salonId: string) {
  return useLiveQuery(
    () => servicesDB.getAll(salonId),
    [salonId]
  );
}

export function useServicesByCategory(salonId: string, category: string) {
  return useLiveQuery(
    () => servicesDB.getByCategory(salonId, category),
    [salonId, category]
  );
}

// ==================== TRANSACTIONS ====================

export function useTransactions(salonId: string) {
  return useLiveQuery(
    () => transactionsDB.getAll(salonId),
    [salonId]
  );
}

export function useTransactionsByDateRange(salonId: string, startDate: Date, endDate: Date) {
  return useLiveQuery(
    () => transactionsDB.getByDateRange(salonId, startDate, endDate),
    [salonId, startDate.toISOString(), endDate.toISOString()]
  );
}

export function useTransaction(id: string | undefined) {
  return useLiveQuery(
    () => id ? transactionsDB.getById(id) : undefined,
    [id]
  );
}

// ==================== SERVICE CATEGORIES ====================

export function useServiceCategories(salonId: string, includeInactive = false) {
  return useLiveQuery(
    () => serviceCategoriesDB.getAll(salonId, includeInactive),
    [salonId, includeInactive]
  );
}

export function useServiceCategoriesWithCounts(salonId: string, includeInactive = false) {
  return useLiveQuery(
    () => serviceCategoriesDB.getWithCounts(salonId, includeInactive),
    [salonId, includeInactive]
  );
}

export function useServiceCategory(id: string | undefined) {
  return useLiveQuery(
    () => id ? serviceCategoriesDB.getById(id) : undefined,
    [id]
  );
}

// ==================== MENU SERVICES (Enhanced) ====================

export function useMenuServices(salonId: string, includeInactive = false) {
  return useLiveQuery(
    () => menuServicesDB.getAll(salonId, includeInactive),
    [salonId, includeInactive]
  );
}

export function useMenuServicesByCategory(salonId: string, categoryId: string, includeInactive = false) {
  return useLiveQuery(
    () => menuServicesDB.getByCategory(salonId, categoryId, includeInactive),
    [salonId, categoryId, includeInactive]
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

export function useMenuServiceSearch(salonId: string, query: string) {
  return useLiveQuery(
    () => query.length >= 2 ? menuServicesDB.search(salonId, query) : [],
    [salonId, query]
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

export function useServicePackages(salonId: string, includeInactive = false) {
  return useLiveQuery(
    () => servicePackagesDB.getAll(salonId, includeInactive),
    [salonId, includeInactive]
  );
}

export function useServicePackage(id: string | undefined) {
  return useLiveQuery(
    () => id ? servicePackagesDB.getById(id) : undefined,
    [id]
  );
}

// ==================== ADD-ON GROUPS ====================

export function useAddOnGroups(salonId: string, includeInactive = false) {
  return useLiveQuery(
    () => addOnGroupsDB.getAll(salonId, includeInactive),
    [salonId, includeInactive]
  );
}

export function useAddOnGroupsWithOptions(salonId: string, includeInactive = false) {
  return useLiveQuery(
    () => addOnGroupsDB.getAllWithOptions(salonId, includeInactive),
    [salonId, includeInactive]
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

export function useAddOnsForService(salonId: string, serviceId: string, categoryId: string) {
  return useLiveQuery(
    () => addOnGroupsDB.getForService(salonId, serviceId, categoryId),
    [salonId, serviceId, categoryId]
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

export function useStaffServiceAssignmentsByStaff(salonId: string, staffId: string) {
  return useLiveQuery(
    () => staffServiceAssignmentsDB.getByStaff(salonId, staffId),
    [salonId, staffId]
  );
}

export function useStaffServiceAssignmentsByService(salonId: string, serviceId: string) {
  return useLiveQuery(
    () => staffServiceAssignmentsDB.getByService(salonId, serviceId),
    [salonId, serviceId]
  );
}

// ==================== CATALOG SETTINGS ====================

export function useCatalogSettings(salonId: string) {
  return useLiveQuery(
    () => catalogSettingsDB.getOrCreate(salonId),
    [salonId]
  );
}
