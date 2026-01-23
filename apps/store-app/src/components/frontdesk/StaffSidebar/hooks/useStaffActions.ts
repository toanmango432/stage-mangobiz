/**
 * useStaffActions Hook
 *
 * Provides action handlers for staff card interactions:
 * - Add Ticket
 * - Add Note
 * - Edit Team Member
 * - Quick Checkout
 * - Clock In/Out
 */

import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setStaffNote } from '@/store/slices/frontDeskSettingsSlice';
import { setSelectedMember } from '@/store/slices/teamSlice';
import { clockIn, clockOut } from '@/store/slices/timesheetSlice';
import { useTicketPanel } from '@/contexts/TicketPanelContext';
import { findStaffByNumericId, isTicketForStaff } from '../utils';
import type { UIStaff } from '@/store/slices/uiStaffSlice';
import type { UITicket } from '../types';

interface UseStaffActionsProps {
  staff: UIStaff[];
  serviceTickets: UITicket[];
  onSelectStaffForNote: (staff: { id: number; name: string }) => void;
  onSelectStaffForDetails: (staff: UIStaff) => void;
}

export function useStaffActions({
  staff,
  serviceTickets,
  onSelectStaffForNote,
  onSelectStaffForDetails,
}: UseStaffActionsProps) {
  const dispatch = useAppDispatch();
  const { openTicketWithData } = useTicketPanel();

  const handleAddTicket = useCallback(
    (staffId: number) => {
      const staffMember = findStaffByNumericId(staff, staffId);
      if (staffMember) {
        openTicketWithData({
          id: '',
          clientName: '',
          techId: String(staffId),
          technician: staffMember.name,
        });
      }
    },
    [staff, openTicketWithData]
  );

  const handleAddNote = useCallback(
    (staffId: number) => {
      const staffMember = findStaffByNumericId(staff, staffId);
      if (staffMember) {
        onSelectStaffForNote({ id: staffId, name: staffMember.name });
      }
    },
    [staff, onSelectStaffForNote]
  );

  const handleSaveStaffNote = useCallback(
    (staffId: number, note: string) => {
      dispatch(setStaffNote({ staffId, note }));
    },
    [dispatch]
  );

  const handleEditTeam = useCallback(
    (staffId: number) => {
      const staffMember = findStaffByNumericId(staff, staffId);
      if (staffMember) {
        dispatch(setSelectedMember(staffMember.id));
        window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: 'team-settings' }));
      }
    },
    [staff, dispatch]
  );

  const handleStaffClick = useCallback(
    (staffMember: UIStaff) => {
      onSelectStaffForDetails(staffMember);
    },
    [onSelectStaffForDetails]
  );

  const handleQuickCheckout = useCallback(
    (staffId: number) => {
      const staffMember = findStaffByNumericId(staff, staffId);
      if (!staffMember) return;

      const staffInServiceTicket = serviceTickets.find((ticket) =>
        isTicketForStaff(ticket, staffMember, staffId)
      );
      if (!staffInServiceTicket) return;

      openTicketWithData({
        id: staffInServiceTicket.id,
        number: staffInServiceTicket.number,
        clientId: staffInServiceTicket.clientId,
        clientName: staffInServiceTicket.clientName,
        clientType: staffInServiceTicket.clientType,
        service: staffInServiceTicket.service,
        services: staffInServiceTicket.checkoutServices ||
          (staffInServiceTicket.service
            ? [
                {
                  serviceName: staffInServiceTicket.service,
                  name: staffInServiceTicket.service,
                  duration: parseInt(String(staffInServiceTicket.duration)) || 30,
                  status: staffInServiceTicket.serviceStatus || 'in_progress',
                  staffId: staffInServiceTicket.techId,
                  staffName: staffInServiceTicket.technician,
                },
              ]
            : []),
        technician: staffInServiceTicket.technician,
        techId: staffInServiceTicket.techId,
        duration: staffInServiceTicket.duration,
        status: staffInServiceTicket.status,
        notes: staffInServiceTicket.notes,
      });
    },
    [staff, serviceTickets, openTicketWithData]
  );

  const handleClockIn = useCallback(
    (staffId: number) => {
      const staffMember = findStaffByNumericId(staff, staffId);
      if (staffMember) {
        dispatch(clockIn({ staffId: staffMember.id }));
      }
    },
    [staff, dispatch]
  );

  const handleClockOut = useCallback(
    (staffId: number) => {
      const staffMember = findStaffByNumericId(staff, staffId);
      if (!staffMember) return;

      const hasActiveTickets = serviceTickets.some((ticket) =>
        isTicketForStaff(ticket, staffMember, staffId)
      );

      if (
        hasActiveTickets &&
        !window.confirm(
          `${staffMember.name} has active tickets. Are you sure you want to clock them out?`
        )
      ) {
        return;
      }

      dispatch(clockOut({ staffId: staffMember.id }));
    },
    [staff, serviceTickets, dispatch]
  );

  return {
    handleAddTicket,
    handleAddNote,
    handleSaveStaffNote,
    handleEditTeam,
    handleStaffClick,
    handleQuickCheckout,
    handleClockIn,
    handleClockOut,
  };
}
