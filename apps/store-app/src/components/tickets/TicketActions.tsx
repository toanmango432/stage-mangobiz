import { useState } from 'react';
import { useTickets } from '@/hooks/useTicketsCompat';
import { UserCheck, CheckCircle, X, Play, Pause, RotateCcw } from 'lucide-react';
import { AssignTicketModal } from './AssignTicketModal';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  assignTicket,
  moveToInService,
  moveToWaiting,
  moveToPending,
  selectPendingTickets,
} from '@/store/slices/uiTicketsSlice';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TicketActionsProps {
  ticketId: number | string;
  section: 'waitlist' | 'in-service' | 'pending';
  compact?: boolean;
}

type ConfirmAction = 'start-service' | 'complete-service' | 'back-to-waiting' | 'back-to-service' | null;

export function TicketActions({
  ticketId,
  section,
  compact = false
}: TicketActionsProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const dispatch = useAppDispatch();
  const pendingTickets = useAppSelector(selectPendingTickets);
  const {
    cancelTicket,
    inService,
    waitlist
  } = useTickets();

  // Find ticket based on section
  const ticket = section === 'waitlist'
    ? waitlist.find(t => t.id === String(ticketId))
    : section === 'in-service'
      ? inService.find(t => t.id === String(ticketId))
      : pendingTickets.find(t => t.id === String(ticketId));

  if (!ticket) return null;

  // Handle cancel ticket
  const handleCancel = () => {
    cancelTicket(String(ticketId));
  };

  // Handle assign ticket
  const handleAssign = async (techId: string, techName: string, techColor: string) => {
    setIsAssigning(true);
    try {
      await dispatch(assignTicket({
        ticketId: String(ticketId),
        staffId: techId,
        staffName: techName,
        staffColor: techColor
      })).unwrap();
      setShowAssignModal(false);
    } catch (error) {
      // Error handling - keep modal open on failure
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle status transitions with confirmation
  const handleStartService = async () => {
    setIsTransitioning(true);
    try {
      await dispatch(moveToInService(String(ticketId))).unwrap();
      setConfirmAction(null);
    } catch (error) {
      // Error handling
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleCompleteService = async () => {
    setIsTransitioning(true);
    try {
      await dispatch(moveToPending(String(ticketId))).unwrap();
      setConfirmAction(null);
    } catch (error) {
      // Error handling
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleBackToWaiting = async () => {
    setIsTransitioning(true);
    try {
      await dispatch(moveToWaiting(String(ticketId))).unwrap();
      setConfirmAction(null);
    } catch (error) {
      // Error handling
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleBackToService = async () => {
    setIsTransitioning(true);
    try {
      await dispatch(moveToWaiting(String(ticketId))).unwrap();
      // Then move to in-service
      await dispatch(moveToInService(String(ticketId))).unwrap();
      setConfirmAction(null);
    } catch (error) {
      // Error handling
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleConfirmAction = () => {
    switch (confirmAction) {
      case 'start-service':
        handleStartService();
        break;
      case 'complete-service':
        handleCompleteService();
        break;
      case 'back-to-waiting':
        handleBackToWaiting();
        break;
      case 'back-to-service':
        handleBackToService();
        break;
    }
  };

  const getConfirmationContent = () => {
    switch (confirmAction) {
      case 'start-service':
        return {
          title: 'Start Service',
          description: `Start service for ${ticket.clientName}? This will move the ticket to "In Service".`,
        };
      case 'complete-service':
        return {
          title: 'Complete Service',
          description: `Mark service as complete for ${ticket.clientName}? This will move the ticket to checkout.`,
        };
      case 'back-to-waiting':
        return {
          title: 'Move to Waiting',
          description: `Move ${ticket.clientName} back to the waiting list?`,
        };
      case 'back-to-service':
        return {
          title: 'Back to Service',
          description: `Resume service for ${ticket.clientName}? This will move the ticket back to "In Service".`,
        };
      default:
        return { title: '', description: '' };
    }
  };

  const confirmContent = getConfirmationContent();

  return <>
      <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
        {/* Waitlist actions */}
        {section === 'waitlist' && (
          <>
            <Tippy content="Start Service">
              <button
                onClick={() => setConfirmAction('start-service')}
                disabled={isTransitioning}
                className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50`}
                aria-label="Start service"
              >
                <Play size={compact ? 16 : 18} />
              </button>
            </Tippy>
            <Tippy content="Assign to technician">
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={isAssigning}
                className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50`}
                aria-label="Assign to technician"
              >
                <UserCheck size={compact ? 16 : 18} />
              </button>
            </Tippy>
            <Tippy content="Cancel ticket">
              <button
                onClick={handleCancel}
                className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors`}
                aria-label="Cancel ticket"
              >
                <X size={compact ? 16 : 18} />
              </button>
            </Tippy>
          </>
        )}

        {/* In-service actions */}
        {section === 'in-service' && (
          <>
            <Tippy content="Complete Service">
              <button
                onClick={() => setConfirmAction('complete-service')}
                disabled={isTransitioning}
                className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50`}
                aria-label="Complete service"
              >
                <CheckCircle size={compact ? 16 : 18} />
              </button>
            </Tippy>
            <Tippy content="Move to Waiting">
              <button
                onClick={() => setConfirmAction('back-to-waiting')}
                disabled={isTransitioning}
                className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors disabled:opacity-50`}
                aria-label="Move to waiting"
              >
                <Pause size={compact ? 16 : 18} />
              </button>
            </Tippy>
          </>
        )}

        {/* Pending actions */}
        {section === 'pending' && (
          <Tippy content="Back to Service">
            <button
              onClick={() => setConfirmAction('back-to-service')}
              disabled={isTransitioning}
              className={`${compact ? 'p-1' : 'p-1.5'} rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50`}
              aria-label="Back to service"
            >
              <RotateCcw size={compact ? 16 : 18} />
            </button>
          </Tippy>
        )}
      </div>

      {/* Assign Ticket Modal */}
      <AssignTicketModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        ticketId={typeof ticketId === 'string' ? parseInt(ticketId) || 0 : ticketId}
        onAssign={handleAssign}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTransitioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={isTransitioning}>
              {isTransitioning ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}