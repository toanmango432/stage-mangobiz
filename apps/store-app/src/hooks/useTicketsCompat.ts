/**
 * Compatibility hook for migrating from TicketContext to Redux
 * This provides the same API as the old useTickets() hook
 * but uses Redux + IndexedDB under the hood.
 *
 * ## US-016: Data Source Documentation
 *
 * ### Important: This hook IS Redux-backed
 * All data returned by this hook comes from Redux selectors:
 * - `staff`: UIStaff[] from `selectAllStaff` (uiStaffSlice)
 * - `serviceTickets`: UITicket[] from `selectServiceTickets` (uiTicketsSlice)
 * - `waitlist`: UITicket[] from `selectWaitlist` (uiTicketsSlice)
 * - `completedTickets`: UITicket[] from `selectCompletedTickets` (uiTicketsSlice)
 * - `pendingTickets`: UITicket[] from `selectPendingTickets` (uiTicketsSlice)
 * - `allAppointments`: Appointment[] from `selectAllAppointments` (appointmentsSlice)
 *
 * ### Why use this hook?
 * Components that previously used TicketContext can use this hook without
 * code changes. It's a migration bridge that maintains API compatibility
 * while using Redux for state management.
 *
 * ### Authoritative Redux Slices
 * - Staff: uiStaffSlice (loaded from teamSlice members)
 * - Tickets: uiTicketsSlice (in-service, waiting, completed, pending)
 * - Appointments: appointmentsSlice (upcoming bookings)
 *
 * @returns Object with staff, tickets, and action methods
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectWaitlist,
  selectServiceTickets,
  selectCompletedTickets,
  selectPendingTickets,
  loadTickets,
  createTicket as createTicketThunk,
  assignTicket as assignTicketThunk,
  completeTicket as completeTicketThunk,
  deleteTicket as deleteTicketThunk,
  markTicketAsPaid as markTicketAsPaidThunk,
  pauseTicket as pauseTicketThunk,
  resumeTicket as resumeTicketThunk,
  checkInAppointment as checkInAppointmentThunk,
  type UITicket,
  type CompletionDetails,
} from '../store/slices/uiTicketsSlice';
import {
  selectAllStaff,
  loadStaff,
  resetAllStaffStatus as resetStaffThunk,
  type UIStaff,
} from '../store/slices/uiStaffSlice';
import { fetchTeamMembers, selectTeamLoading, selectTeamMemberIds } from '../store/slices/teamSlice';
import { selectAllAppointments } from '../store/slices/appointmentsSlice';
import { selectStoreId } from '../store/slices/authSlice';
import { selectClients } from '../store/slices/clientsSlice';
import type { PaymentMethod, PaymentDetails } from '../types';

// Re-export types for compatibility
export type { UITicket as Ticket, UIStaff as Staff, CompletionDetails };

/**
 * Hook that provides the same API as the old TicketContext
 * Components can use this without changing their code
 */
export function useTicketsCompat() {
  const dispatch = useAppDispatch();

  // Selectors
  const waitlist = useAppSelector(selectWaitlist);
  const serviceTickets = useAppSelector(selectServiceTickets);
  const completedTickets = useAppSelector(selectCompletedTickets);
  const pendingTickets = useAppSelector(selectPendingTickets);
  const staff = useAppSelector(selectAllStaff);
  const allAppointments = useAppSelector(selectAllAppointments);
  const clients = useAppSelector(selectClients);

  // Get storeId from auth state (same as Team Settings uses)
  const authStoreId = useAppSelector(selectStoreId);
  const storeId = authStoreId || 'default-store';

  // Watch for team data to arrive in Redux (used by loadStaff dependency)
  const teamMemberIds = useAppSelector(selectTeamMemberIds);

  // Effect 1: Load tickets AND team members in parallel (both independent)
  useEffect(() => {
    console.log('[useTicketsCompat] Loading data in parallel for storeId:', storeId);

    // These are independent - run in parallel for performance
    Promise.all([
      dispatch(loadTickets(storeId)),
      dispatch(fetchTeamMembers(storeId)),
    ]).then(() => {
      console.log('[useTicketsCompat] Parallel data loading complete');
    });
  }, [dispatch, storeId]);

  // Effect 2: Load staff ONLY after team data arrives in Redux
  // This ensures state.team.members is populated before loadStaff reads from it
  useEffect(() => {
    if (teamMemberIds.length > 0) {
      console.log('[useTicketsCompat] Team loaded (' + teamMemberIds.length + ' members), now loading staff...');
      dispatch(loadStaff(storeId));
    }
  }, [dispatch, storeId, teamMemberIds.length]);

  // Transform appointments to coming appointments format
  // Filter to show only today's upcoming appointments (not checked in yet)
  const comingAppointments = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return allAppointments
      .filter(apt => {
        const aptTime = new Date(apt.scheduledStartTime);
        // Show appointments for today that haven't been checked in
        return aptTime >= todayStart &&
               aptTime < todayEnd &&
               apt.status !== 'checked-in' &&
               apt.status !== 'in-service' &&
               apt.status !== 'completed' &&
               apt.status !== 'cancelled' &&
               apt.status !== 'no-show';
      })
      .map(apt => {
        // Find staff color from staff list
        const assignedStaff = staff.find(s => s.id === apt.staffId);
        const totalDuration = apt.services?.reduce((sum, s) => sum + (s.duration || 0), 0) || 60;

        // Find client data to get VIP status and visit count
        const client = clients.find(c => c.id === apt.clientId);
        const totalVisits = client?.visitSummary?.totalVisits ?? client?.totalVisits ?? 0;
        // Client is first visit if they have 0 completed visits (this will be their first)
        const isFirstVisit = totalVisits === 0;

        return {
          id: apt.id,
          clientName: apt.clientName || 'Unknown Client',
          clientPhoto: client?.avatar,
          appointmentTime: apt.scheduledStartTime,
          service: apt.services?.[0]?.serviceName || 'Service',
          duration: `${totalDuration}m`,
          technician: apt.staffName || assignedStaff?.name || 'Any Available',
          techColor: assignedStaff?.color || '#6B7280',
          status: apt.status || 'booked',
          isVip: client?.isVip ?? false,
          isFirstVisit,
        };
      })
      .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());
  }, [allAppointments, staff, clients]);

  // PERFORMANCE FIX: Wrap all API functions in useCallback to prevent re-renders
  const createTicket = useCallback((ticketData: Omit<UITicket, 'id' | 'number' | 'status' | 'createdAt' | 'updatedAt'>) => {
    dispatch(createTicketThunk(ticketData));
  }, [dispatch]);

  const assignTicket = useCallback((ticketId: string, staffId: string, staffName: string, staffColor: string) => {
    dispatch(assignTicketThunk({ ticketId, staffId, staffName, staffColor }));
  }, [dispatch]);

  const completeTicket = useCallback((ticketId: string, completionDetails: CompletionDetails) => {
    dispatch(completeTicketThunk({ ticketId, completionDetails }));
  }, [dispatch]);

  const cancelTicket = useCallback((ticketId: string) => {
    // TODO: Implement cancel logic
    console.log('Cancel ticket:', ticketId);
  }, []);

  const deleteTicket = useCallback((ticketId: string, reason: string) => {
    dispatch(deleteTicketThunk({ ticketId, reason }));
  }, [dispatch]);

  const resetStaffStatus = useCallback(() => {
    dispatch(resetStaffThunk());
  }, [dispatch]);

  const checkInAppointment = useCallback((appointmentId: string) => {
    return dispatch(checkInAppointmentThunk(appointmentId));
  }, [dispatch]);

  const createAppointment = useCallback((appointmentData: any) => {
    // TODO: Implement create appointment
    console.log('Create appointment:', appointmentData);
  }, []);

  const markTicketAsPaid = useCallback((
    ticketId: string,
    paymentMethod: PaymentMethod,
    paymentDetails: PaymentDetails,
    tip: number
  ) => {
    return dispatch(markTicketAsPaidThunk({ ticketId, paymentMethod, paymentDetails, tip }));
  }, [dispatch]);

  const pauseTicket = useCallback((ticketId: string) => {
    dispatch(pauseTicketThunk(ticketId));
  }, [dispatch]);

  const resumeTicket = useCallback((ticketId: string) => {
    dispatch(resumeTicketThunk(ticketId));
  }, [dispatch]);

  // PERFORMANCE FIX: Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Data
    waitlist,
    inService: serviceTickets,
    services: serviceTickets,  // Alias for serviceTickets
    serviceTickets, // Also provide this name for compatibility
    completed: completedTickets,
    pendingTickets,
    staff,
    appointments: allAppointments,
    comingAppointments,

    // Functions
    createTicket,
    assignTicket,
    completeTicket,
    cancelTicket,
    deleteTicket,
    resetStaffStatus,
    checkInAppointment,
    createAppointment,
    markTicketAsPaid,
    pauseTicket,
    resumeTicket,
  }), [
    waitlist, serviceTickets, completedTickets, pendingTickets, staff,
    allAppointments, comingAppointments,
    createTicket, assignTicket, completeTicket, cancelTicket, deleteTicket,
    resetStaffStatus, checkInAppointment, createAppointment, markTicketAsPaid,
    pauseTicket, resumeTicket,
  ]);
}

// Also export as useTickets for drop-in replacement
export { useTicketsCompat as useTickets };
