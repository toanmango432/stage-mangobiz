import React, { useEffect, useState } from 'react';
import { Clock, Tag, User, AlertCircle, Check } from 'lucide-react';
import { useTickets } from '../hooks/useTicketsCompat';
import { MobileSheet, MobileSheetContent, MobileSheetFooter, MobileSheetButton } from './layout/MobileSheet';
import { useBreakpoint } from '../hooks/useMobileModal';
import { haptics } from '../utils/haptics';

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
  const { isMobile } = useBreakpoint();
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
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

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
      haptics.error();
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

    // Success feedback and close
    haptics.success();
    onClose();
  };

  // Client type button for touch-friendly selection
  const ClientTypeButton = ({ type, label }: { type: string; label: string }) => {
    const isActive = clientType === type;
    return (
      <button
        type="button"
        onClick={() => {
          haptics.selection();
          setClientType(type);
        }}
        className={`
          flex-1 py-3 rounded-xl border-2 transition-all font-medium text-sm
          min-h-[48px] active:scale-95
          ${isActive
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-600 active:bg-gray-50'
          }
        `}
      >
        {label}
      </button>
    );
  };

  // Duration button for touch-friendly selection
  const DurationButton = ({ value, label }: { value: string; label: string }) => {
    const isActive = duration === value;
    return (
      <button
        type="button"
        onClick={() => {
          haptics.selection();
          setDuration(value);
        }}
        className={`
          py-2.5 px-3 rounded-lg border-2 transition-all font-medium text-sm
          min-h-[44px] active:scale-95
          ${isActive
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-600 active:bg-gray-50'
          }
        `}
      >
        {label}
      </button>
    );
  };

  const footer = (
    <MobileSheetFooter stacked={isMobile}>
      <MobileSheetButton
        variant="secondary"
        onClick={onClose}
        fullWidth={isMobile}
      >
        Cancel
      </MobileSheetButton>
      <MobileSheetButton
        variant="primary"
        onClick={() => handleSubmit()}
        fullWidth
        className="bg-green-600 hover:bg-green-700 active:bg-green-800"
      >
        <Check size={20} />
        Create Ticket
      </MobileSheetButton>
    </MobileSheetFooter>
  );

  return (
    <MobileSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Ticket"
      footer={footer}
      fullScreenOnMobile={true}
    >
      <MobileSheetContent className="space-y-5">
        {/* Client Name */}
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
            Client Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="clientName"
              className={`
                w-full pl-12 pr-4 py-3 border rounded-xl text-base
                focus:outline-none focus:ring-2 transition-all
                ${errors.clientName
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }
              `}
              style={{ fontSize: '16px' }}
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                if (errors.clientName) setErrors({ ...errors, clientName: undefined });
              }}
              placeholder="Enter client name"
            />
          </div>
          {errors.clientName && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1 flex-shrink-0" />
              {errors.clientName}
            </p>
          )}
        </div>

        {/* Client Type - Touch-friendly buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            <ClientTypeButton type="Regular" label="Regular" />
            <ClientTypeButton type="VIP" label="VIP" />
            <ClientTypeButton type="New" label="New" />
            <ClientTypeButton type="Priority" label="Priority" />
          </div>
        </div>

        {/* Service */}
        <div>
          <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
            Service <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Tag size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="service"
              className={`
                w-full pl-12 pr-4 py-3 border rounded-xl text-base
                focus:outline-none focus:ring-2 transition-all
                ${errors.service
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }
              `}
              style={{ fontSize: '16px' }}
              value={service}
              onChange={(e) => {
                setService(e.target.value);
                if (errors.service) setErrors({ ...errors, service: undefined });
              }}
              placeholder="Enter service type"
            />
          </div>
          {errors.service && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1 flex-shrink-0" />
              {errors.service}
            </p>
          )}
        </div>

        {/* Time */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Clock size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="time"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              style={{ fontSize: '16px' }}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="HH:MM AM/PM"
            />
          </div>
        </div>

        {/* Duration - Touch-friendly buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            <DurationButton value="15 min" label="15 min" />
            <DurationButton value="30 min" label="30 min" />
            <DurationButton value="45 min" label="45 min" />
            <DurationButton value="1 hour" label="1 hour" />
            <DurationButton value="1.5 hours" label="1.5 hrs" />
            <DurationButton value="2 hours" label="2 hours" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            style={{ fontSize: '16px' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information"
          />
        </div>
      </MobileSheetContent>
    </MobileSheet>
  );
}