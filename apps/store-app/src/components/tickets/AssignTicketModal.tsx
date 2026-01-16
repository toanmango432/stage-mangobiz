import { useEffect, useState, useMemo } from 'react';
import { X, Search, Check, AlertTriangle } from 'lucide-react';
import { useTickets } from '@/hooks/useTicketsCompat';
import { useAppSelector } from '@/store/hooks';
import { selectServiceTickets, checkStaffConflict, type StaffConflictResult } from '@/store/slices/uiTicketsSlice';
import 'tippy.js/dist/tippy.css';
interface AssignTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (techId: string, techName: string, techColor: string) => void;
  ticketId: string | number | null;
}
interface FeedbackMessage {
  type: 'success' | 'error';
  message: string;
}
export function AssignTicketModal({
  isOpen,
  onClose,
  onAssign,
  ticketId
}: AssignTicketModalProps) {
  const {
    staff,
    waitlist,
  } = useTickets();

  // Get current in-service tickets for conflict detection
  const serviceTickets = useAppSelector(selectServiceTickets);

  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);

  // State for conflict confirmation dialog
  const [pendingAssignment, setPendingAssignment] = useState<{
    techId: string;
    techName: string;
    techColor: string;
    conflict: StaffConflictResult;
  } | null>(null);

  // Build conflict map for all staff members
  const staffConflicts = useMemo(() => {
    const conflicts = new Map<string, StaffConflictResult>();
    staff.forEach(s => {
      const conflict = checkStaffConflict(s.id, serviceTickets);
      if (conflict.hasConflict) {
        conflicts.set(s.id, conflict);
      }
    });
    return conflicts;
  }, [staff, serviceTickets]);
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTech(null);
      setSearchQuery('');
      setFeedbackMessage(null);
      setPendingAssignment(null);
    }
  }, [isOpen]);
  // Close feedback message after a delay
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);
  // Filter staff based on search query
  const filteredStaff = staff.filter(tech => tech.status !== 'off') // Only show available techs
  .filter(tech => tech.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => {
    // Sort by status first (ready first, then busy)
    if (a.status !== b.status) {
      return a.status === 'ready' ? -1 : 1;
    }
    // Then sort by name
    return a.name.localeCompare(b.name);
  });
  // Execute the actual assignment
  const executeAssignment = (techId: string, techName: string, techColor: string) => {
    try {
      onAssign(techId, techName, techColor);
      // Bug #4 fix: Trust Redux, show success and close immediately
      setFeedbackMessage({
        type: 'success',
        message: `Ticket assigned to ${techName} successfully!`
      });
      // Close the modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error('Error during ticket assignment:', error);
      setFeedbackMessage({
        type: 'error',
        message: 'Failed to assign ticket. Please try again.'
      });
    }
  };

  // Handle assign button click - checks for conflicts first
  const handleAssign = (techId: string, techName: string, techColor: string) => {
    if (ticketId === null) {
      setFeedbackMessage({
        type: 'error',
        message: 'Please select a technician before assigning.'
      });
      return;
    }

    // Check if this staff member has a conflict
    const conflict = staffConflicts.get(techId);
    if (conflict?.hasConflict) {
      // Show confirmation dialog
      setPendingAssignment({ techId, techName, techColor, conflict });
      return;
    }

    // No conflict - proceed with assignment
    executeAssignment(techId, techName, techColor);
  };

  // Handle confirmation to assign anyway
  const handleConfirmAssignment = () => {
    if (pendingAssignment) {
      executeAssignment(
        pendingAssignment.techId,
        pendingAssignment.techName,
        pendingAssignment.techColor
      );
      setPendingAssignment(null);
    }
  };

  // Handle cancel of assignment
  const handleCancelAssignment = () => {
    setPendingAssignment(null);
  };
  // Find the ticket details
  const ticket = ticketId !== null ? waitlist.find(t => t.id === String(ticketId)) : null;
  if (!isOpen) return null;
  return <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
        {/* Modal container */}
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Modal header */}
          <div className="bg-gradient-to-r from-[#00D0E0] to-[#22A5C9] p-4 text-white flex justify-between items-center">
            <h2 className="text-lg font-bold">Assign Ticket</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Ticket details */}
          {ticket && <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <div className="bg-[#00D0E0] text-white text-xs font-bold px-2 py-1 rounded-full mr-2">
                  #{ticket.number}
                </div>
                <h3 className="text-gray-800 font-semibold">
                  {ticket.clientName}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">{ticket.service}</p>
            </div>}

          {/* Modal content */}
          <div className="p-4">
            {/* Search bar */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                Select a technician
              </h3>
              <button onClick={() => setShowSearch(!showSearch)} className="text-gray-500 hover:text-[#00D0E0] p-1 rounded-md">
                <Search size={18} />
              </button>
            </div>

            {showSearch && <div className="mb-4 relative">
                <input type="text" placeholder="Search technicians..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00D0E0] pl-8" />
                <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>}

            {/* Technician list */}
            <div className="max-h-60 overflow-y-auto mb-4 rounded-md border border-gray-200">
              {filteredStaff.length > 0 ? filteredStaff.map(tech => {
                const conflict = staffConflicts.get(tech.id);
                const hasConflict = conflict?.hasConflict;

                return (
                  <button
                    key={tech.id}
                    onClick={() => handleAssign(tech.id, tech.name, tech.color)}
                    className={`w-full p-3 flex items-center justify-between border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${selectedTech === tech.id ? 'bg-[#00D0E0]/10' : ''} ${hasConflict ? 'bg-amber-50' : ''}`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img src={tech.image} alt={tech.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${tech.status === 'ready' ? 'bg-green-500' : tech.status === 'busy' ? 'bg-amber-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{tech.name}</span>
                          {hasConflict && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex-shrink-0">
                              <AlertTriangle size={12} />
                              Busy
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${hasConflict ? 'text-amber-600' : tech.status === 'ready' ? 'text-green-600' : tech.status === 'busy' ? 'text-amber-600' : 'text-gray-500'}`}>
                          {hasConflict ? (
                            <span>Currently serving {conflict.clientName}</span>
                          ) : tech.status === 'ready' ? (
                            'Ready'
                          ) : tech.status === 'busy' ? (
                            `Busy (${tech.activeTickets?.length || 0} active tickets)`
                          ) : (
                            'Unavailable'
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedTech === tech.id ? 'border-[#00D0E0] bg-[#00D0E0] text-white' : 'border-gray-300'}`}>
                      {selectedTech === tech.id && <Check size={14} />}
                    </div>
                  </button>
                );
              }) : <div className="p-4 text-center text-gray-500">
                  No technicians found
                </div>}
            </div>

            {/* Feedback message */}
            {feedbackMessage && <div className={`p-3 mb-4 rounded-md ${feedbackMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {feedbackMessage.message}
              </div>}

            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => {
                if (selectedTech !== null) {
                  const tech = staff.find(s => s.id === selectedTech);
                  if (tech) handleAssign(tech.id, tech.name, tech.color);
                }
              }} disabled={selectedTech === null} className={`px-4 py-2 rounded-md text-white transition-colors ${selectedTech === null ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#00D0E0] hover:bg-[#00B0C0]'}`}>
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Confirmation Dialog */}
      {pendingAssignment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center"
          onClick={handleCancelAssignment}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div className="bg-amber-500 p-4 text-white flex items-center gap-3">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Staff Already Busy</h3>
            </div>

            {/* Dialog content */}
            <div className="p-4">
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">{pendingAssignment.techName}</span> is currently serving{' '}
                <span className="font-semibold">{pendingAssignment.conflict.clientName}</span>.
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Assigning anyway will queue this client for when {pendingAssignment.techName} becomes available.
              </p>

              {/* Dialog actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelAssignment}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAssignment}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                >
                  Assign Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>;
}