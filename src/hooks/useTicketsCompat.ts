/**
 * Compatibility hook for migrating from TicketContext to Redux
 * This provides the same API as the old useTickets() hook
 * but uses Redux + IndexedDB under the hood
 */

import { useEffect } from 'react';
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
  type UITicket,
  type CompletionDetails,
} from '../store/slices/uiTicketsSlice';
import {
  selectAllStaff,
  loadStaff,
  resetAllStaffStatus as resetStaffThunk,
  type UIStaff,
} from '../store/slices/uiStaffSlice';

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

  // Load data on mount
  useEffect(() => {
    const salonId = 'salon-001'; // TODO: Get from auth
    dispatch(loadTickets(salonId));
    dispatch(loadStaff(salonId));
  }, [dispatch]);

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
    // TODO: Implement check-in logic
    console.log('Check in appointment:', appointmentId);
  };

  const createAppointment = (appointmentData: any) => {
    // TODO: Implement create appointment
    console.log('Create appointment:', appointmentData);
  };

  const markTicketAsPaid = (ticketId: string) => {
    // TODO: Implement mark as paid
    console.log('Mark ticket as paid:', ticketId);
  };

  const pauseTicket = (ticketId: string) => {
    // TODO: Implement pause ticket
    console.log('Pause ticket:', ticketId);
  };

  const resumeTicket = (ticketId: string) => {
    // TODO: Implement resume ticket
    console.log('Resume ticket:', ticketId);
  };

  // Mock coming appointments data
  const mockComingAppointments = [
    // Late appointments
    { id: 101, clientName: 'Jennifer Smith', appointmentTime: new Date(Date.now() - 15 * 60000).toISOString(), service: 'Gel Manicure', duration: '45m', technician: 'Sophia', techColor: '#9B5DE5', status: 'booked', isVip: true },
    { id: 102, clientName: 'Michael Johnson', appointmentTime: new Date(Date.now() - 25 * 60000).toISOString(), service: 'Haircut', duration: '30m', technician: 'James', techColor: '#3F83F8', status: 'booked' },
    // Within 1 hour
    { id: 103, clientName: 'Ashley Williams', appointmentTime: new Date(Date.now() + 10 * 60000).toISOString(), service: 'Facial', duration: '60m', technician: 'Emma', techColor: '#4CC2A9', status: 'booked' },
    { id: 104, clientName: 'David Brown', appointmentTime: new Date(Date.now() + 20 * 60000).toISOString(), service: 'Pedicure', duration: '45m', technician: 'Olivia', techColor: '#E5565B', status: 'booked', isVip: true },
    { id: 105, clientName: 'Sarah Miller', appointmentTime: new Date(Date.now() + 35 * 60000).toISOString(), service: 'Color & Highlights', duration: '120m', technician: 'Sophia', techColor: '#9B5DE5', status: 'booked', isVip: true },
    { id: 106, clientName: 'Chris Anderson', appointmentTime: new Date(Date.now() + 50 * 60000).toISOString(), service: 'Manicure', duration: '30m', technician: 'Isabella', techColor: '#4CC2A9', status: 'booked' },
    // Within 3 hours
    { id: 107, clientName: 'Patricia Martinez', appointmentTime: new Date(Date.now() + 75 * 60000).toISOString(), service: 'Spa Treatment', duration: '90m', technician: 'Emma', techColor: '#4CC2A9', status: 'booked' },
    { id: 108, clientName: 'Sam Rodriguez', appointmentTime: new Date(Date.now() + 100 * 60000).toISOString(), service: 'Haircut & Style', duration: '60m', technician: 'James', techColor: '#3F83F8', status: 'booked' },
    { id: 109, clientName: 'Phoenix White', appointmentTime: new Date(Date.now() + 130 * 60000).toISOString(), service: 'Styling', duration: '45m', technician: 'Sophia', techColor: '#9B5DE5', status: 'booked', isVip: true },
    { id: 110, clientName: 'Cameron Lee', appointmentTime: new Date(Date.now() + 160 * 60000).toISOString(), service: 'Massage', duration: '60m', technician: 'Olivia', techColor: '#E5565B', status: 'booked' },
  ];

  // Return same interface as old TicketContext
  return {
    // Data
    waitlist,
    inService: serviceTickets,
    serviceTickets, // Also provide this name for compatibility
    completed: completedTickets,
    pendingTickets,
    staff,
    appointments: [], // TODO: Load from appointments slice
    comingAppointments: mockComingAppointments,
    
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
