/**
 * useStaffTicketInfo Hook
 *
 * Provides ticket information for staff members from Redux serviceTickets.
 * Returns activeTickets and currentTicketInfo for display on StaffCards.
 */

import { useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectServiceTickets, type UITicket } from '@/store/slices/uiTicketsSlice';
import type { ActiveTicket, CurrentTicketInfo, StaffTicketInfoResult } from '../types';

/**
 * Calculate time values based on start time and duration
 */
const calculateTimeInfo = (
  ticket: UITicket
): { timeLeft: number; totalTime: number; progress: number } => {
  const durationStr = ticket.duration || '30min';
  const totalTimeMinutes = parseInt(durationStr.replace(/\D/g, '')) || 30;

  // Use createdAt as the start time (when service started)
  const startTime =
    ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt);
  const now = new Date();
  const elapsedMs = now.getTime() - startTime.getTime();
  const elapsedMinutes = elapsedMs / (1000 * 60);

  // Calculate time left (can be negative if overtime)
  const timeLeft = Math.max(0, totalTimeMinutes - elapsedMinutes);

  // Progress is elapsed time / total duration, capped between 0 and 1
  const progress = Math.min(1, Math.max(0, elapsedMinutes / totalTimeMinutes));

  return { timeLeft, totalTime: totalTimeMinutes, progress };
};

/**
 * Format time for display (e.g., "10:15AM")
 */
const formatStartTime = (ticket: UITicket): string => {
  const startTime =
    ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt);
  return startTime
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toUpperCase()
    .replace(' ', '');
};

/**
 * Hook that provides staff ticket information lookup function
 *
 * @returns A function to get ticket info for a specific staff member
 *
 * @example
 * const getStaffTicketInfo = useStaffTicketInfo();
 * const ticketInfo = getStaffTicketInfo(staffMember.id);
 * if (ticketInfo) {
 *   // Display ticketInfo.activeTickets and ticketInfo.currentTicketInfo
 * }
 */
export function useStaffTicketInfo(): (
  staffId: string | number
) => StaffTicketInfoResult | null {
  const inServiceTickets = useAppSelector(selectServiceTickets);

  return useCallback(
    (staffId: string | number): StaffTicketInfoResult | null => {
      // Match tickets by techId, staffId, or assignedTo.id (handle all three)
      const staffInServiceTickets = inServiceTickets.filter((ticket: UITicket) => {
        // Check all possible staff ID fields on the ticket
        const ticketStaffId =
          ticket.techId ||
          (ticket as { staffId?: string }).staffId ||
          ticket.assignedTo?.id;
        // Handle both string and number IDs with proper type guard
        const staffIdStr = String(staffId);
        return ticketStaffId === staffIdStr || ticketStaffId === staffId;
      });

      if (staffInServiceTickets.length === 0) {
        return null;
      }

      // Get the first (primary) ticket for current ticket info
      const primaryTicket = staffInServiceTickets[0];

      // Build active tickets array for StaffCard - matches StaffCardVertical.ActiveTicket type
      const activeTickets: ActiveTicket[] = staffInServiceTickets.map((ticket, idx) => ({
        id: idx + 1, // Sequential numeric ID for display (ActiveTicket expects number)
        ticketNumber: ticket.number, // Actual ticket number for reference
        clientName: ticket.clientName || 'Walk-in',
        serviceName: ticket.service || 'Service',
        status: 'in-service' as const, // Type-safe status literal
      }));

      // Build current ticket info for display - matches StaffCardVertical.CurrentTicketInfo type
      const timeInfo = calculateTimeInfo(primaryTicket);
      const currentTicketInfo: CurrentTicketInfo = {
        timeLeft: timeInfo.timeLeft,
        totalTime: timeInfo.totalTime,
        progress: timeInfo.progress,
        startTime: formatStartTime(primaryTicket),
        serviceName: primaryTicket.service || 'Service',
        clientName: primaryTicket.clientName || 'Walk-in',
      };

      return { activeTickets, currentTicketInfo };
    },
    [inServiceTickets]
  );
}
