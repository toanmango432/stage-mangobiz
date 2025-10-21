import React from 'react';
import { X, User, Tag, Clock, Timer, Calendar, Info, Edit2, Trash2 } from 'lucide-react';
import { useTickets } from '../context/TicketContext';
interface TicketDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
  onEdit?: (ticketId: number) => void;
  onDelete?: (ticketId: number) => void;
}
export function TicketDetailsModal({
  isOpen,
  onClose,
  ticketId,
  onEdit,
  onDelete
}: TicketDetailsModalProps) {
  const {
    waitlist,
    services,
    pendingTickets
  } = useTickets();
  if (!isOpen || !ticketId) return null;
  // Find the ticket across all lists
  const ticket = [...waitlist, ...services, ...pendingTickets].find(t => t.id === ticketId);
  if (!ticket) return null;
  // Determine ticket status
  let status = 'Unknown';
  let statusColor = 'bg-gray-100 text-gray-700';
  if (waitlist.some(t => t.id === ticketId)) {
    status = 'Waiting';
    statusColor = 'bg-blue-100 text-blue-700 border-blue-200';
  } else if (services.some(t => t.id === ticketId)) {
    status = 'In Service';
    statusColor = 'bg-green-100 text-green-700 border-green-200';
  } else if (pendingTickets.some(t => t.id === ticketId)) {
    status = 'Pending';
    statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
  }
  // Get ticket location in the salon
  let location = 'Unknown';
  if (ticket.technician) {
    location = `With ${ticket.technician}`;
  } else if (waitlist.some(t => t.id === ticketId)) {
    location = 'In waiting area';
  }
  return <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose} />
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Modal header with ticket number */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md mr-3">
                {ticket.number}
              </div>
              Ticket Details
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
          {/* Modal body */}
          <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
            {/* Status banner */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Status:</span>
                  <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${statusColor} border`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Location:</span>
                  <span className="text-sm font-medium">{location}</span>
                </div>
              </div>
            </div>
            {/* Ticket details */}
            <div className="p-4 space-y-4">
              {/* Client information */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center mb-3">
                  <User size={18} className="text-gray-500 mr-2" />
                  <h3 className="text-sm font-bold text-gray-700">
                    Client Information
                  </h3>
                </div>
                <div className="ml-7 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-800">
                      {ticket.clientName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <span className="inline-block text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                      {ticket.clientType}
                    </span>
                  </div>
                </div>
              </div>
              {/* Service information */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center mb-3">
                  <Tag size={18} className="text-gray-500 mr-2" />
                  <h3 className="text-sm font-bold text-gray-700">
                    Service Information
                  </h3>
                </div>
                <div className="ml-7 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Service</p>
                    <p className="text-sm font-medium text-gray-800">
                      {ticket.service}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <div className="flex items-center">
                        <Clock size={14} className="text-gray-400 mr-1" />
                        <p className="text-sm font-medium text-gray-800">
                          {ticket.time || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <div className="flex items-center">
                        <Timer size={14} className="text-gray-400 mr-1" />
                        <p className="text-sm font-medium text-gray-800">
                          {ticket.duration || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Technician information (if assigned) */}
              {ticket.technician && <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-3">
                    <User size={18} className="text-gray-500 mr-2" />
                    <h3 className="text-sm font-bold text-gray-700">
                      Technician
                    </h3>
                  </div>
                  <div className="ml-7">
                    <div className={`${ticket.techColor} text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm inline-block`}>
                      {ticket.technician}
                    </div>
                  </div>
                </div>}
              {/* Notes (if any) */}
              {ticket.notes && <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-3">
                    <Info size={18} className="text-gray-500 mr-2" />
                    <h3 className="text-sm font-bold text-gray-700">Notes</h3>
                  </div>
                  <div className="ml-7">
                    <p className="text-sm text-gray-700">{ticket.notes}</p>
                  </div>
                </div>}
              {/* Ticket history */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center mb-3">
                  <Calendar size={18} className="text-gray-500 mr-2" />
                  <h3 className="text-sm font-bold text-gray-700">
                    Ticket History
                  </h3>
                </div>
                <div className="ml-7">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700">
                          Created
                        </p>
                        <p className="text-xs text-gray-500">
                          {ticket.time || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {ticket.technician && <div className="flex items-start">
                        <div className="bg-green-100 rounded-full p-1 mr-2 mt-0.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            Assigned to {ticket.technician}
                          </p>
                          <p className="text-xs text-gray-500">
                            Time not recorded
                          </p>
                        </div>
                      </div>}
                    {status === 'Pending' && <div className="flex items-start">
                        <div className="bg-amber-100 rounded-full p-1 mr-2 mt-0.5">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            Service Completed
                          </p>
                          <p className="text-xs text-gray-500">
                            Time not recorded
                          </p>
                        </div>
                      </div>}
                  </div>
                </div>
              </div>
            </div>
            {/* Modal footer with actions */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
              {/* Left side - delete button */}
              {onDelete && <button onClick={() => onDelete(ticket.id)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center">
                  <Trash2 size={14} className="mr-1.5" />
                  Delete
                </button>}
              {/* Right side - edit and close buttons */}
              <div className="flex space-x-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                  Close
                </button>
                {onEdit && <button onClick={() => onEdit(ticket.id)} className="px-4 py-2 bg-[#27AE60] text-white rounded-md hover:bg-[#219653] transition-colors text-sm flex items-center">
                    <Edit2 size={14} className="mr-1.5" />
                    Edit
                  </button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>;
}