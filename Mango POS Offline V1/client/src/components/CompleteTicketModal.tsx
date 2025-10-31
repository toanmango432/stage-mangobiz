import React, { useEffect, useState } from 'react';
import { useTickets } from '../hooks/useTicketsCompat';
import { X, CheckCircle, Tag, Clock, Calendar, DollarSign, FileText, User } from 'lucide-react';
interface CompleteTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (ticketId: number) => void;
  ticketId: number | null;
}
export function CompleteTicketModal({
  isOpen,
  onClose,
  onComplete,
  ticketId
}: CompleteTicketModalProps) {
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const {
    inService
  } = useTickets();
  // Find the selected ticket
  const selectedTicket = inService.find(ticket => ticket.id === ticketId);
  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setPaymentMethod('cash');
    }
  }, [isOpen]);
  // Handle complete button click
  const handleComplete = () => {
    if (ticketId !== null) {
      onComplete(ticketId);
    }
  };
  if (!isOpen) return null;
  return <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl z-50 w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-green-50 p-4 border-b border-green-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Complete Ticket
              </h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>
          {/* Ticket Info */}
          {selectedTicket && <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-md text-green-700 mr-3">
                  <CheckCircle size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="font-semibold text-gray-800 mr-2">
                      #{selectedTicket.number}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {selectedTicket.clientName}
                    </span>
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                      {selectedTicket.clientType}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag size={14} className="mr-1" />
                    <span>{selectedTicket.service}</span>
                    <span className="mx-2">•</span>
                    <User size={14} className="mr-1" />
                    <span>{selectedTicket.technician}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Calendar size={14} className="mr-1" />
                    <span>{selectedTicket.time}</span>
                    <span className="mx-2">•</span>
                    <Clock size={14} className="mr-1" />
                    <span>{selectedTicket.duration}</span>
                  </div>
                </div>
              </div>
            </div>}
          {/* Form */}
          <div className="p-4">
            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <div className="flex space-x-2">
                <button className={`flex-1 py-2 px-4 rounded-md border-2 ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'}`} onClick={() => setPaymentMethod('cash')}>
                  <div className="flex items-center justify-center">
                    <DollarSign size={16} className="mr-1" />
                    <span>Cash</span>
                  </div>
                </button>
                <button className={`flex-1 py-2 px-4 rounded-md border-2 ${paymentMethod === 'card' ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'}`} onClick={() => setPaymentMethod('card')}>
                  <div className="flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span>Card</span>
                  </div>
                </button>
                <button className={`flex-1 py-2 px-4 rounded-md border-2 ${paymentMethod === 'other' ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'}`} onClick={() => setPaymentMethod('other')}>
                  <div className="flex items-center justify-center">
                    <span>Other</span>
                  </div>
                </button>
              </div>
            </div>
            {/* Notes */}
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Completion Notes
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FileText size={16} />
                </div>
                <textarea id="notes" className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" rows={3} placeholder="Add any notes about the service..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors" onClick={onClose}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center" onClick={handleComplete}>
                <CheckCircle size={18} className="mr-2" />
                Complete Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </>;
}