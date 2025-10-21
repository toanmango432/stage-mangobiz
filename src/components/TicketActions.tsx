import React, { useState } from 'react';
import { useTickets } from '../context/TicketContext';
import { UserCheck, CheckCircle, X } from 'lucide-react';
import { AssignTicketModal } from './AssignTicketModal';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
interface TicketActionsProps {
  ticketId: number;
  section: 'waitlist' | 'in-service';
  compact?: boolean;
}
export function TicketActions({
  ticketId,
  section,
  compact = false
}: TicketActionsProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const {
    completeTicket,
    cancelTicket,
    inService,
    waitlist
  } = useTickets();
  const ticket = section === 'waitlist' ? waitlist.find(t => t.id === ticketId) : inService.find(t => t.id === ticketId);
  if (!ticket) return null;
  // Handle complete ticket
  const handleComplete = () => {
    completeTicket(ticketId);
  };
  // Handle cancel ticket
  const handleCancel = () => {
    cancelTicket(ticketId);
  };
  return <>
      <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
        {section === 'waitlist' && <Tippy content="Assign to technician">
            <button onClick={() => setShowAssignModal(true)} className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors`} aria-label="Assign to technician">
              <UserCheck size={compact ? 16 : 18} />
            </button>
          </Tippy>}
        {section === 'in-service' && <Tippy content="Complete service">
            <button onClick={handleComplete} className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors`} aria-label="Complete service">
              <CheckCircle size={compact ? 16 : 18} />
            </button>
          </Tippy>}
        {section === 'waitlist' && <Tippy content="Cancel ticket">
            <button onClick={handleCancel} className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors`} aria-label="Cancel ticket">
              <X size={compact ? 16 : 18} />
            </button>
          </Tippy>}
      </div>
      {/* Assign Ticket Modal */}
      <AssignTicketModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} ticketId={ticketId} />
    </>;
}