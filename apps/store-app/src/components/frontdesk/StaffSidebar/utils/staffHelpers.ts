/**
 * Staff Helper Utilities
 *
 * Pure functions for staff-related operations including ID matching,
 * image generation, and status determination.
 */

import type { UIStaff, UITicket } from '../types';

/**
 * Find staff by numeric ID
 * StaffCardVertical passes numeric IDs, but UIStaff.id is a UUID string.
 * This helper handles the conversion/matching logic.
 */
export const findStaffByNumericId = (
  staffList: UIStaff[],
  numericId: number
): UIStaff | undefined => {
  return staffList.find((s) => {
    // Try to extract numeric portion from UUID if possible, or match as string
    const id =
      typeof s.id === 'string'
        ? parseInt(s.id.replace(/\D/g, '')) || 0
        : Number(s.id);
    return id === numericId;
  });
};

/**
 * Check if a ticket belongs to a staff member
 * Matches by techId, assignedTo.id, or numeric staff ID conversion
 */
export const isTicketForStaff = (
  ticket: UITicket,
  staff: UIStaff,
  numericStaffId: number
): boolean => {
  const ticketStaffId = ticket.techId || ticket.assignedTo?.id;
  return ticketStaffId === staff.id || ticketStaffId === String(numericStaffId);
};

/**
 * Get staff image URL
 * Uses actual staff image from backend data, or generates an avatar
 * using ui-avatars.com based on staff name
 */
export const getStaffImage = (staffMember: {
  image?: string;
  name?: string;
}): string => {
  // If staff has an image from backend, use it
  if (staffMember.image) {
    return staffMember.image;
  }
  // Otherwise generate an initials-based avatar
  const name = staffMember.name || 'Staff';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
};

/**
 * Determine staff status based on active tickets
 * Returns staff with status updated to 'busy' if they have active tickets,
 * 'ready' if not, or unchanged if already 'off'
 */
export const determineStaffStatus = (
  staff: UIStaff,
  inServiceTickets: UITicket[]
): UIStaff => {
  // Keep 'off' status unchanged
  if (staff.status === 'off') return staff;

  // Check if this staff member has any tickets in service
  const hasActiveTickets = inServiceTickets.some(
    (ticket) => ticket.assignedTo?.id === staff.id
  );

  // Update status based on active tickets
  return {
    ...staff,
    status: hasActiveTickets ? 'busy' : 'ready',
  };
};

/**
 * Convert string ID to number for StaffCard compatibility
 * Extracts numeric portion from UUID or uses index as fallback
 */
export const staffIdToNumber = (id: string, fallbackIndex: number): number => {
  return typeof id === 'string'
    ? parseInt(id.replace(/\D/g, '')) || fallbackIndex + 1
    : Number(id);
};
