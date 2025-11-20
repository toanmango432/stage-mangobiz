import { User, Calendar, AlertCircle, MessageSquare, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AppointmentPopoverProps {
  appointment: {
    id: string;
    clientName?: string;
    service?: string;
    appointmentTime: string;
    duration?: string;
    isVip?: boolean;
    technician?: string;
    techColor?: string;
  };
  onClose: () => void;
  onCheckIn?: (appointment: any) => void;
  onEdit?: (appointment: any) => void;
  onCancel?: (appointment: any) => void;
  onAddNote?: (appointment: any) => void;
}

export const AppointmentPopover = ({
  appointment,
  onClose,
  onCheckIn,
  onEdit,
  onCancel,
  onAddNote
}: AppointmentPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close on Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const appointmentTime = new Date(appointment.appointmentTime);
  const formattedTime = appointmentTime.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div
      ref={popoverRef}
      className="fixed right-[210px] top-1/2 -translate-y-1/2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-right-2 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popover-title"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 id="popover-title" className="text-sm font-semibold text-gray-900 truncate">
            {appointment.clientName || 'Guest'}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {appointment.service}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formattedTime}
            {appointment.duration && ` • ${appointment.duration}`}
          </p>
          {appointment.technician && (
            <div
              className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium text-white"
              style={{
                backgroundColor: appointment.techColor || '#9CA3AF'
              }}
            >
              {appointment.technician.split(' ')[0].toUpperCase()}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Actions */}
      <div className="py-1">
        <button
          onClick={() => {
            onCheckIn?.(appointment);
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <User size={14} className="text-green-600" />
          </div>
          <span>Check In</span>
        </button>

        <button
          onClick={() => {
            onEdit?.(appointment);
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Calendar size={14} className="text-blue-600" />
          </div>
          <span>Edit</span>
        </button>

        <button
          onClick={() => {
            onCancel?.(appointment);
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={14} className="text-red-600" />
          </div>
          <span>Cancel</span>
        </button>

        <button
          onClick={() => {
            onAddNote?.(appointment);
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <MessageSquare size={14} className="text-gray-600" />
          </div>
          <span>Add Note</span>
        </button>
      </div>
    </div>
  );
};
