/**
 * Compatibility hook for migrating from TicketContext to Redux
 * This provides the same API as the old useTickets() hook
 * but uses Redux + IndexedDB under the hood
 */

import { useEffect, useMemo } from 'react';
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
import { fetchTeamMembers } from '../store/slices/teamSlice';
import { selectAllAppointments } from '../store/slices/appointmentsSlice';
import { selectStoreId } from '../store/slices/authSlice';
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

  // Get storeId from auth state (same as Team Settings uses)
  const authStoreId = useAppSelector(selectStoreId);

  // Load data on mount
  useEffect(() => {
    // Use storeId from auth if available, fallback to default-store
    const storeId = authStoreId || 'default-store';
    console.log('[useTicketsCompat] Loading data with storeId:', storeId);

    // Load tickets
    dispatch(loadTickets(storeId));

    // First fetch team members from Supabase into Redux, then load staff for UI
    // This ensures state.team.members is populated before loadStaff reads from it
    dispatch(fetchTeamMembers(storeId)).then(() => {
      console.log('[useTicketsCompat] Team members fetched, now loading staff...');
      dispatch(loadStaff(storeId));
    });
  }, [dispatch, authStoreId]);

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

        return {
          id: apt.id,
          clientName: apt.clientName || 'Unknown Client',
          appointmentTime: apt.scheduledStartTime,
          service: apt.services?.[0]?.serviceName || 'Service',
          duration: `${totalDuration}m`,
          technician: apt.staffName || assignedStaff?.name || 'Any Available',
          techColor: assignedStaff?.color || '#6B7280',
          status: apt.status || 'booked',
          isVip: false, // TODO: Get from client data
        };
      })
      .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());
  }, [allAppointments, staff]);

  // API functions (matching old TicketContext interface)
  const createTicket = (ticketData: Omit<UITicket, 'id' | 'number' | 'status' | 'createdAt' | 'updatedAt'>) => {
    dispatch(createTicketThunk(ticketData));
  };

  const assignTicket = (ticketId: string, staffId: string, staffName: string, staffColor: string) => {
    dispatch(assignTicketThunk({ ticketId, staffId, staffName, staffColor }));
  };

  const completeTicket = (ticketId: string, completionDetails: CompletionDetails) => {
    dispatch(completeTicketThunk({ ticketId, completionDetails }));
  };

  const cancelTicket = (ticketId: string) => {
    // TODO: Implement cancel logic
    console.log('Cancel ticket:', ticketId);
  };

  const deleteTicket = (ticketId: string, reason: string) => {
    dispatch(deleteTicketThunk({ ticketId, reason }));
  };

  const resetStaffStatus = () => {
    dispatch(resetStaffThunk());
  };

  const checkInAppointment = (appointmentId: string) => {
    return dispatch(checkInAppointmentThunk(appointmentId));
  };

  const createAppointment = (appointmentData: any) => {
    // TODO: Implement create appointment
    console.log('Create appointment:', appointmentData);
  };

  const markTicketAsPaid = (
    ticketId: string,
    paymentMethod: PaymentMethod,
    paymentDetails: PaymentDetails,
    tip: number
  ) => {
    return dispatch(markTicketAsPaidThunk({ ticketId, paymentMethod, paymentDetails, tip }));
  };

  const pauseTicket = (ticketId: string) => {
    dispatch(pauseTicketThunk(ticketId));
  };

  const resumeTicket = (ticketId: string) => {
    dispatch(resumeTicketThunk(ticketId));
  };

  // Return same interface as old TicketContext
  return {
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
  };
}

// Also export as useTickets for drop-in replacement
export { useTicketsCompat as useTickets };
