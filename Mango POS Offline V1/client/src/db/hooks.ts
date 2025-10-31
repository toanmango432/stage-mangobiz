import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './schema';
import { appointmentsDB, ticketsDB, staffDB, clientsDB, servicesDB, transactionsDB } from './database';
import type { Appointment, Ticket, Staff, Client, Service, Transaction } from '../types';

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
