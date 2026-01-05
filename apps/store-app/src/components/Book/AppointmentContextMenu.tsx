/**
 * Context Menu for Appointments
 * Right-click quick actions
 */

import { useEffect, useRef } from 'react';
import { Edit2, CheckCircle, PlayCircle, XCircle, UserX, Calendar, Copy, CopyPlus, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';

interface AppointmentContextMenuProps {
  appointment: LocalAppointment | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onCheckIn: (appointment: LocalAppointment) => void;
  onStartService: (appointment: LocalAppointment) => void;
  onComplete: (appointment: LocalAppointment) => void;
  onEdit: (appointment: LocalAppointment) => void;
  onReschedule: (appointment: LocalAppointment) => void;
  onCancel: (appointment: LocalAppointment) => void;
  onNoShow: (appointment: LocalAppointment) => void;
  onCopy?: (appointment: LocalAppointment) => void;
  onDuplicate?: (appointment: LocalAppointment) => void;
  onRebook?: (appointment: LocalAppointment) => void;
}

export function AppointmentContextMenu({
  appointment,
  position,
  onClose,
  onCheckIn,
  onStartService,
  onComplete,
  onEdit,
  onReschedule,
  onCancel,
  onNoShow,
  onCopy,
  onDuplicate,
  onRebook,
}: AppointmentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (position) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [position, onClose]);

  if (!appointment || !position) return null;

  const menuItems = [
    {
      label: 'Check In',
      icon: CheckCircle,
      onClick: () => {
        onCheckIn(appointment);
        onClose();
      },
      color: 'text-brand-600',
      show: appointment.status === 'scheduled',
    },
    {
      label: 'Start Service',
      icon: PlayCircle,
      onClick: () => {
        onStartService(appointment);
        onClose();
      },
      color: 'text-green-600',
      show: appointment.status === 'checked-in',
    },
    {
      label: 'Complete',
      icon: CheckCircle,
      onClick: () => {
        onComplete(appointment);
        onClose();
      },
      color: 'text-blue-600',
      show: appointment.status === 'in-service',
    },
    {
      label: 'Edit',
      icon: Edit2,
      onClick: () => {
        onEdit(appointment);
        onClose();
      },
      color: 'text-gray-700',
      show: true,
    },
    {
      label: 'Reschedule',
      icon: Calendar,
      onClick: () => {
        onReschedule(appointment);
        onClose();
      },
      color: 'text-purple-600',
      show: appointment.status !== 'completed' && appointment.status !== 'cancelled',
    },
    // Divider placeholder - Copy/Duplicate/Rebook section
    {
      label: 'divider',
      icon: null as any,
      onClick: () => {},
      color: '',
      show: true,
      isDivider: true,
    },
    {
      label: 'Copy',
      icon: Copy,
      onClick: () => {
        onCopy?.(appointment);
        onClose();
      },
      color: 'text-gray-600',
      show: !!onCopy,
      shortcut: '⌘C',
    },
    {
      label: 'Duplicate',
      icon: CopyPlus,
      onClick: () => {
        onDuplicate?.(appointment);
        onClose();
      },
      color: 'text-indigo-600',
      show: !!onDuplicate,
    },
    {
      label: 'Rebook',
      icon: RefreshCw,
      onClick: () => {
        onRebook?.(appointment);
        onClose();
      },
      color: 'text-violet-600',
      show: !!onRebook && appointment.status === 'completed',
      description: 'Book again with same details',
    },
    // Divider before danger actions
    {
      label: 'divider2',
      icon: null as any,
      onClick: () => {},
      color: '',
      show: appointment.status !== 'completed' && appointment.status !== 'cancelled',
      isDivider: true,
    },
    {
      label: 'No Show',
      icon: UserX,
      onClick: () => {
        onNoShow(appointment);
        onClose();
      },
      color: 'text-orange-600',
      show: appointment.status === 'scheduled' || appointment.status === 'checked-in',
    },
    {
      label: 'Cancel',
      icon: XCircle,
      onClick: () => {
        onCancel(appointment);
        onClose();
      },
      color: 'text-red-600',
      show: appointment.status !== 'completed' && appointment.status !== 'cancelled',
    },
  ];

  const visibleItems = menuItems.filter(item => item.show);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[200px] z-[100] animate-scale-in"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Appointment Info */}
      <div className="px-4 py-2 border-b border-gray-200">
        <p className="font-bold text-sm text-gray-900 truncate">{appointment.clientName}</p>
        <p className="text-xs text-gray-500 truncate">
          {new Date(appointment.scheduledStartTime).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          })}
        </p>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {visibleItems.map((item, index) => {
          // Handle dividers
          if ((item as any).isDivider) {
            return <div key={index} className="my-1 border-t border-gray-200" />;
          }

          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                'w-full px-4 py-2 text-left text-sm flex items-center justify-between',
                'hover:bg-gray-100 transition-colors',
                item.color
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {/* Keyboard shortcut hint */}
              {(item as any).shortcut && (
                <span className="text-xs text-gray-400 ml-4">{(item as any).shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
