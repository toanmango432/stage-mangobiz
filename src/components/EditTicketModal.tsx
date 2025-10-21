import React, { useEffect, useState } from 'react';
import { X, User, Tag, Clock, Timer, AlertTriangle } from 'lucide-react';
import { useTickets } from '../context/TicketContext';
interface EditTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
}
export function EditTicketModal({
  isOpen,
  onClose,
  ticketId
}: EditTicketModalProps) {
  const {
    waitlist,
    inService,
    completed
  } = useTickets();
  const [formData, setFormData] = useState({
    clientName: '',
    clientType: '',
    service: '',
    time: '',
    duration: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Find the ticket to edit across all ticket lists
  useEffect(() => {
    if (isOpen && ticketId) {
      const ticket = [...waitlist, ...inService, ...completed].find(t => t.id === ticketId);
      if (ticket) {
        setFormData({
          clientName: ticket.clientName || '',
          clientType: ticket.clientType || '',
          service: ticket.service || '',
          time: ticket.time || '',
          duration: ticket.duration || '',
          notes: ticket.notes || ''
        });
      }
    }
  }, [isOpen, ticketId, waitlist, inService, completed]);
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        clientName: '',
        clientType: '',
        service: '',
        time: '',
        duration: '',
        notes: ''
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);
  if (!isOpen) return null;
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    if (!formData.clientType) {
      newErrors.clientType = 'Client type is required';
    }
    if (!formData.service.trim()) {
      newErrors.service = 'Service is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      // For now, just close the modal since editTicket function doesn't exist
      // In a real implementation, you would update the ticket data
      console.log('Edit ticket data:', {
        ticketId,
        formData
      });
      // Close modal after successful edit
      onClose();
      setIsSubmitting(false);
    }
  };
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  return <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose} />
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Modal header */}
          <div className="bg-gradient-to-r from-[#27AE60]/10 to-[#27AE60]/5 p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Tag className="mr-2 text-[#27AE60]" size={20} />
              Edit Ticket
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
          {/* Modal body */}
          <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-4">
            <form onSubmit={handleSubmit}>
              {/* Client information */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <User size={16} className="text-[#27AE60] mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Client Information
                  </label>
                </div>
                <div className="space-y-3">
                  {/* Client name */}
                  <div>
                    <label htmlFor="clientName" className="block text-xs font-medium text-gray-700 mb-1">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} className={`w-full p-2 border ${errors.clientName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]`} placeholder="Enter client name" />
                    {errors.clientName && <p className="text-red-500 text-xs mt-1">
                        {errors.clientName}
                      </p>}
                  </div>
                  {/* Client type */}
                  <div>
                    <label htmlFor="clientType" className="block text-xs font-medium text-gray-700 mb-1">
                      Client Type <span className="text-red-500">*</span>
                    </label>
                    <select id="clientType" name="clientType" value={formData.clientType} onChange={handleChange} className={`w-full p-2 border ${errors.clientType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]`}>
                      <option value="">Select client type</option>
                      <option value="New">New</option>
                      <option value="Regular">Regular</option>
                      <option value="VIP">VIP</option>
                      <option value="Walk-in">Walk-in</option>
                    </select>
                    {errors.clientType && <p className="text-red-500 text-xs mt-1">
                        {errors.clientType}
                      </p>}
                  </div>
                </div>
              </div>
              {/* Service information */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Tag size={16} className="text-[#27AE60] mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Service Information
                  </label>
                </div>
                <div className="space-y-3">
                  {/* Service */}
                  <div>
                    <label htmlFor="service" className="block text-xs font-medium text-gray-700 mb-1">
                      Service <span className="text-red-500">*</span>
                    </label>
                    <input type="text" id="service" name="service" value={formData.service} onChange={handleChange} className={`w-full p-2 border ${errors.service ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]`} placeholder="Enter service" />
                    {errors.service && <p className="text-red-500 text-xs mt-1">
                        {errors.service}
                      </p>}
                  </div>
                  {/* Time and Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="time" className="block text-xs font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <Clock size={14} className="text-gray-400" />
                        </div>
                        <input type="text" id="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]" placeholder="e.g. 10:30AM" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="duration" className="block text-xs font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <Timer size={14} className="text-gray-400" />
                        </div>
                        <input type="text" id="duration" name="duration" value={formData.duration} onChange={handleChange} className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]" placeholder="e.g. 45m" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Notes */}
              <div className="mb-4">
                <label htmlFor="notes" className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#27AE60] focus:border-[#27AE60]" placeholder="Add any additional notes..." />
              </div>
              {/* Form actions */}
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#27AE60] text-white rounded-md hover:bg-[#219653] transition-colors flex items-center">
                  {isSubmitting ? <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </> : 'Save Changes'}
                </button>
              </div>
              {/* Warning about ticket status */}
              <div className="mt-4 bg-amber-50 p-3 rounded-md border border-amber-200 flex">
                <AlertTriangle size={16} className="text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Editing a ticket will not change its current status or
                  position in the workflow.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>;
}