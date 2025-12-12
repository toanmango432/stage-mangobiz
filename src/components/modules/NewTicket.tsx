import { useEffect, useCallback } from 'react';
import TicketPanel from '../checkout/TicketPanel';
import { useAppSelector } from '../../store/hooks';
import { selectAllStaff } from '../../store/slices/uiStaffSlice';
import { StaffMember } from '../checkout/ServiceList';

interface NewTicketProps {
  onBack?: () => void;
}

export function NewTicket({ onBack }: NewTicketProps) {
  // Get staff from Redux
  const staffFromRedux = useAppSelector(selectAllStaff);

  // Convert Redux staff to StaffMember format
  const staffMembers: StaffMember[] = staffFromRedux.map(s => ({
    id: s.id,
    name: s.name,
    available: s.status === 'ready',
    specialty: s.specialty,
  }));

  // Clear any stored pending ticket on mount (we're creating new)
  useEffect(() => {
    localStorage.removeItem('checkout-pending-ticket');
    localStorage.removeItem('checkout-auto-open');
  }, []);

  // Handle close/back navigation
  const handleClose = useCallback(() => {
    localStorage.removeItem('checkout-pending-ticket');

    if (onBack) {
      onBack();
    } else {
      // Navigate to frontdesk by default
      window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: 'frontdesk' }));
    }
  }, [onBack]);

  return (
    <div className="h-full w-full">
      <TicketPanel
        isOpen={true}
        onClose={handleClose}
        staffMembers={staffMembers.length > 0 ? staffMembers : [
          { id: 'staff-1', name: 'Staff Member', available: true },
        ]}
      />
    </div>
  );
}
