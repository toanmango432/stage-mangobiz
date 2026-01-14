/**
 * useStaffAppointments Hook
 *
 * Provides appointment and completed ticket lookup functions for staff members.
 * Used to display next appointment time and last service time on StaffCards.
 */

import { useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectAllAppointments } from '@/store/slices/appointmentsSlice';
import { selectCompletedTickets, type UITicket } from '@/store/slices/uiTicketsSlice';
import type { LocalAppointment } from '../types';

/**
 * Hook that provides staff's next upcoming appointment lookup
 *
 * @returns A function to get the next appointment time for a staff member
 *
 * @example
 * const getStaffNextAppointment = useStaffNextAppointment();
 * const nextApptTime = getStaffNextAppointment(staffMember.id);
 * // Returns "10:30 AM" or undefined
 */
export function useStaffNextAppointment(): (staffId: string | number) => string | undefined {
  const allAppointments = useAppSelector(selectAllAppointments);

  return useCallback(
    (staffId: string | number): string | undefined => {
      const now = new Date();

      // Filter appointments for this staff that are:
      // 1. In the future (or within next few hours)
      // 2. Status is 'scheduled' or 'confirmed' (not cancelled, completed, etc.)
      const upcomingAppointments = allAppointments.filter((apt: LocalAppointment) => {
        // Match by staffId
        if (apt.staffId !== String(staffId) && apt.staffId !== staffId) {
          return false;
        }

        // Check status - only include scheduled/confirmed appointments
        const validStatuses = ['scheduled', 'confirmed', 'pending'];
        if (!validStatuses.includes(apt.status)) {
          return false;
        }

        // Check if appointment is in the future
        // LocalAppointment.scheduledStartTime is always a string (ISO format)
        const aptTime = new Date(apt.scheduledStartTime);
        return aptTime > now;
      });

      if (upcomingAppointments.length === 0) {
        return undefined;
      }

      // Sort by start time and get the earliest one
      // LocalAppointment.scheduledStartTime is always a string (ISO format)
      const sortedAppointments = upcomingAppointments.sort((a, b) => {
        const timeA = new Date(a.scheduledStartTime).getTime();
        const timeB = new Date(b.scheduledStartTime).getTime();
        return timeA - timeB;
      });

      const nextApt = sortedAppointments[0];
      const aptTime = new Date(nextApt.scheduledStartTime);

      // Format as "10:30 AM" style
      return aptTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    },
    [allAppointments]
  );
}

/**
 * Hook that provides staff's last completed service time lookup
 *
 * @returns A function to get the last service time for a staff member
 *
 * @example
 * const getStaffLastServiceTime = useStaffLastServiceTime();
 * const lastServiceTime = getStaffLastServiceTime(staffMember.id);
 * // Returns "2:15 PM" or undefined
 */
export function useStaffLastServiceTime(): (staffId: string | number) => string | undefined {
  const completedTickets = useAppSelector(selectCompletedTickets);

  return useCallback(
    (staffId: string | number): string | undefined => {
      // Filter completed tickets for this staff
      const staffCompletedTickets = completedTickets.filter((ticket: UITicket) => {
        const ticketStaffId = ticket.techId || ticket.assignedTo?.id;
        return ticketStaffId === String(staffId) || ticketStaffId === staffId;
      });

      if (staffCompletedTickets.length === 0) {
        return undefined;
      }

      // Sort by updated time (most recent first) to get the latest completed ticket
      // Use time field which contains the ticket time, or createdAt/updatedAt
      const sortedTickets = staffCompletedTickets.sort((a, b) => {
        // Try to get a timestamp from the ticket
        const getTimestamp = (t: UITicket): number => {
          // updatedAt is when the ticket was marked as paid/completed
          if (t.updatedAt) {
            const time =
              typeof t.updatedAt === 'string' ? new Date(t.updatedAt) : t.updatedAt;
            return time.getTime();
          }
          if (t.createdAt) {
            const time =
              typeof t.createdAt === 'string' ? new Date(t.createdAt) : t.createdAt;
            return time.getTime();
          }
          return 0;
        };
        return getTimestamp(b) - getTimestamp(a);
      });

      const lastTicket = sortedTickets[0];

      // Get the completion/update time
      let lastTime: Date | undefined;
      if (lastTicket.updatedAt) {
        lastTime =
          typeof lastTicket.updatedAt === 'string'
            ? new Date(lastTicket.updatedAt)
            : lastTicket.updatedAt;
      } else if (lastTicket.createdAt) {
        lastTime =
          typeof lastTicket.createdAt === 'string'
            ? new Date(lastTicket.createdAt)
            : lastTicket.createdAt;
      }

      if (!lastTime) {
        return undefined;
      }

      // Format as "10:30 AM" style
      return lastTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    },
    [completedTickets]
  );
}
