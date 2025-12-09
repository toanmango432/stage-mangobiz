import { useState, useEffect } from 'react';
import TicketPanel from '../checkout/TicketPanel';
import { Search, CreditCard, Plus, Trash2 } from 'lucide-react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { useAppSelector } from '../../store/hooks';
import { selectAllStaff } from '../../store/slices/uiStaffSlice';
import type { PendingTicket } from '../../store/slices/uiTicketsSlice';
import { StaffMember } from '../checkout/ServiceList';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

export function Checkout() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<PendingTicket | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Auto-open panel if navigated from FrontDesk with intent to create new ticket
  useEffect(() => {
    // Check if there's a flag to auto-open the panel for new ticket
    const autoOpen = localStorage.getItem('checkout-auto-open');
    if (autoOpen === 'new') {
      localStorage.removeItem('checkout-auto-open');
      localStorage.removeItem('checkout-pending-ticket');
      setIsPanelOpen(true);
    }
  }, []);

  // Get pending tickets from Redux via useTicketsCompat hook
  const { pendingTickets, deleteTicket } = useTickets();

  // Get staff from Redux
  const staffFromRedux = useAppSelector(selectAllStaff);

  // Convert Redux staff to StaffMember format (including specialty for color matching)
  const staffMembers: StaffMember[] = staffFromRedux.map(s => ({
    id: s.id,
    name: s.name,
    available: s.status === 'ready',
    specialty: s.specialty,
  }));

  const handleOpenPanel = (ticketId?: string) => {
    if (ticketId) {
      // Store ticket in localStorage for TicketPanel to load
      const ticket = pendingTickets.find(t => t.id === ticketId);
      if (ticket) {
        localStorage.setItem('checkout-pending-ticket', JSON.stringify(ticket));
      }
    } else {
      // New ticket - clear any stored pending ticket
      localStorage.removeItem('checkout-pending-ticket');
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    localStorage.removeItem('checkout-pending-ticket');
  };

  // Handle open delete confirmation modal
  const openDeleteConfirmation = (ticket: PendingTicket, e: React.MouseEvent) => {
    e.stopPropagation();
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  // Handle ticket deletion
  const handleDeleteTicket = () => {
    if (ticketToDelete && deleteReason.trim() !== '' && deleteTicket) {
      deleteTicket(ticketToDelete.id, deleteReason);
      setShowDeleteModal(false);
      setTicketToDelete(null);
      setDeleteReason('');
    }
  };

  // Filter tickets by search query
  const filteredTickets = pendingTickets.filter(ticket =>
    ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.number.toString().includes(searchQuery) ||
    ticket.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total amount
  const totalAmount = filteredTickets.reduce((sum, t) => sum + t.subtotal + t.tax + t.tip, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>{pendingTickets.length} pending</span>
              {pendingTickets.length > 0 && (
                <span className="font-semibold text-gray-900">(${totalAmount.toFixed(2)})</span>
              )}
            </div>
            <button
              onClick={() => handleOpenPanel()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, ticket # or service..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Pending Tickets List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {filteredTickets.map((ticket) => (
            <PendingTicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={() => handleOpenPanel(ticket.id)}
              onDelete={(e) => openDeleteConfirmation(ticket, e)}
            />
          ))}

          {filteredTickets.length === 0 && pendingTickets.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No pending tickets</p>
              <p className="text-sm text-gray-400 mt-1">Completed services will appear here for checkout</p>
            </div>
          )}

          {filteredTickets.length === 0 && pendingTickets.length > 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No tickets match your search</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-sm text-blue-500 hover:text-blue-600"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Panel - Full checkout experience */}
      <TicketPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        staffMembers={staffMembers.length > 0 ? staffMembers : [
          { id: 'staff-1', name: 'Staff Member', available: true },
        ]}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-11/12 max-w-md overflow-hidden border border-gray-200">
            <div className="bg-red-50 p-4 border-b border-red-100">
              <div className="flex items-center">
                <div className="bg-red-500 p-2 rounded-full text-white mr-3">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Delete Pending Ticket</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this pending ticket?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{ticketToDelete.clientName}</span>
                    <span className="text-sm text-gray-500">#{ticketToDelete.number}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{ticketToDelete.service}</p>
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <select
                  id="deleteReason"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="client_no_show">Client No-Show</option>
                  <option value="client_cancelled">Client Cancelled</option>
                  <option value="payment_issue">Payment Issue</option>
                  <option value="service_issue">Service Issue</option>
                  <option value="duplicate_entry">Duplicate Entry</option>
                  <option value="other">Other</option>
                </select>
                {deleteReason === '' && (
                  <p className="text-sm text-red-500 mt-1">Please select a reason for deletion</p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTicketToDelete(null);
                    setDeleteReason('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${deleteReason === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleDeleteTicket}
                  disabled={deleteReason === ''}
                >
                  Delete Ticket
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Separate component for pending ticket row
function PendingTicketRow({ ticket, onClick, onDelete }: { ticket: PendingTicket; onClick: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const total = ticket.subtotal + ticket.tax + ticket.tip;

  // Get staff info
  const staffList = ticket.assignedStaff || [];
  const primaryStaff = staffList[0] || (ticket.technician ? { name: ticket.technician, color: ticket.techColor } : null);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer relative group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Client avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
            style={{
              background: primaryStaff?.color || 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            }}
          >
            {ticket.clientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{ticket.clientName}</h3>
              {ticket.clientType === 'VIP' && <span className="text-sm">⭐</span>}
            </div>
            <p className="text-sm text-gray-500">Ticket #{ticket.number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
            <p className="text-sm text-gray-500">
              {ticket.additionalServices > 0
                ? `${ticket.additionalServices + 1} service(s)`
                : '1 service'}
            </p>
          </div>
          {/* Delete button */}
          <Tippy content="Delete ticket">
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete ticket"
            >
              <Trash2 size={18} />
            </button>
          </Tippy>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {/* Primary service */}
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {ticket.service}
            </span>
            {/* Additional services indicator */}
            {ticket.additionalServices > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{ticket.additionalServices} more
              </span>
            )}
          </div>

          {/* Staff badges */}
          <div className="flex items-center gap-1">
            {staffList.slice(0, 2).map((staff, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-white text-xs font-medium rounded"
                style={{ background: staff.color || '#6B7280' }}
              >
                {staff.name.split(' ')[0]}
              </span>
            ))}
            {staffList.length > 2 && (
              <span className="text-xs text-gray-500">+{staffList.length - 2}</span>
            )}
            {staffList.length === 0 && primaryStaff && (
              <span
                className="px-2 py-1 text-white text-xs font-medium rounded"
                style={{ background: primaryStaff.color || '#6B7280' }}
              >
                {primaryStaff.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
