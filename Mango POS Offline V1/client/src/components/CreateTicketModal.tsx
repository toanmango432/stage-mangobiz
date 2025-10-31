import React, { useEffect, useState } from 'react';
import { X, UserPlus, Calendar, Clock, Tag, User, Users, AlertCircle } from 'lucide-react';
import { useTickets } from '../hooks/useTicketsCompat';
interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (ticketData: any) => void;
}
export function CreateTicketModal({
  isOpen,
  onClose,
  onSubmit
}: CreateTicketModalProps) {
  // Form state
  const [clientName, setClientName] = useState('');
  const [clientType, setClientType] = useState('Regular');
  const [service, setService] = useState('');
  const [duration, setDuration] = useState('30 min');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedHours = hours % 12 || 12;
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  });
  // Validation state
  const [errors, setErrors] = useState<{
    clientName?: string;
    service?: string;
  }>({});
  // Get createTicket function from context
  const {
    createTicket
  } = useTickets();
  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      // Reset form fields
      setClientName('');
      setClientType('Regular');
      setService('');
      setDuration('30 min');
      setNotes('');
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedHours = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';
      setTime(`${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`);
      setErrors({});
    }
  }, [isOpen]);
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    const newErrors: {
      clientName?: string;
      service?: string;
    } = {};
    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    if (!service.trim()) {
      newErrors.service = 'Service is required';
    }
    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // Create new ticket
    const ticketData = {
      clientName,
      clientType,
      service,
      duration,
      notes,
      time
    };
    if (onSubmit) {
      onSubmit(ticketData);
    } else {
      createTicket(ticketData);
    }
    // Close modal
    onClose();
  };
  if (!isOpen) return null;
  return <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-11/12 max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#27AE60] p-4 text-white flex items-center justify-between">
          <div className="flex items-center">
            <UserPlus size={20} className="mr-2" />
            <h2 className="text-lg font-bold">Create New Ticket</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* Client Name */}
          <div className="mb-4">
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-gray-400" />
              </div>
              <input type="text" id="clientName" className={`w-full pl-10 pr-3 py-2 border ${errors.clientName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#27AE60] focus:border-[#27AE60]'} rounded-md shadow-sm focus:outline-none focus:ring-2`} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Enter client name" />
            </div>
            {errors.clientName && <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.clientName}
              </p>}
          </div>
          {/* Client Type */}
          <div className="mb-4">
            <label htmlFor="clientType" className="block text-sm font-medium text-gray-700 mb-1">
              Client Type
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users size={16} className="text-gray-400" />
              </div>
              <select id="clientType" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60] appearance-none" value={clientType} onChange={e => setClientType(e.target.value)}>
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="New">New</option>
                <option value="Priority">Priority</option>
              </select>
            </div>
          </div>
          {/* Service */}
          <div className="mb-4">
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
              Service <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag size={16} className="text-gray-400" />
              </div>
              <input type="text" id="service" className={`w-full pl-10 pr-3 py-2 border ${errors.service ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#27AE60] focus:border-[#27AE60]'} rounded-md shadow-sm focus:outline-none focus:ring-2`} value={service} onChange={e => setService(e.target.value)} placeholder="Enter service type" />
            </div>
            {errors.service && <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.service}
              </p>}
          </div>
          {/* Time and Duration Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Time */}
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock size={16} className="text-gray-400" />
                </div>
                <input type="text" id="time" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]" value={time} onChange={e => setTime(e.target.value)} placeholder="HH:MM AM/PM" />
              </div>
            </div>
            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={16} className="text-gray-400" />
                </div>
                <select id="duration" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60] appearance-none" value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="1 hour">1 hour</option>
                  <option value="1.5 hours">1.5 hours</option>
                  <option value="2 hours">2 hours</option>
                </select>
              </div>
            </div>
          </div>
          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea id="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any additional information"></textarea>
          </div>
          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#27AE60] text-white rounded-md hover:bg-[#219653] transition-colors shadow-md">
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </>;
}