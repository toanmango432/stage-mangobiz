/**
 * AppointmentCard Component
 * Displays an appointment on the calendar with paper ticket aesthetic
 */

import { memo, useState, useMemo } from 'react';
import { User, BadgeCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { formatTimeDisplay, formatDurationDisplay } from '../../utils/timeUtils';

interface AppointmentCardProps {
  appointment: LocalAppointment;
  top: number;
  height: number;
  onClick?: () => void;
  className?: string;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; fg: string; border: string; label: string }
> = {
  requested: { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D', label: 'Requested' },
  scheduled: { bg: '#E0F2FE', fg: '#075985', border: '#93C5FD', label: 'Scheduled' },
  confirmed: { bg: '#DCFCE7', fg: '#166534', border: '#86EFAC', label: 'Confirmed' },
  'in-progress': { bg: '#F3E8FF', fg: '#6B21A8', border: '#D8B4FE', label: 'In Service' },
  completed: { bg: '#F1F5F9', fg: '#334155', border: '#CBD5E1', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', fg: '#991B1B', border: '#FCA5A5', label: 'Cancelled' },
  'no-show': { bg: '#FFEDD5', fg: '#9A3412', border: '#FDBA74', label: 'No Show' },
};

const SOURCE_COLORS: Record<string, string> = {
  online: '#26C6DA',
  'walk-in': '#66BB6A',
  phone: '#7E57C2',
  app: '#EC4899',
  default: '#14B8A6',
};

function getInitials(name?: string) {
  if (!name) return '•';
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) return '•';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const AppointmentCard = memo(function AppointmentCard({
  appointment,
  top,
  height,
  onClick,
  className,
}: AppointmentCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const statusStyle = STATUS_STYLES[appointment.status] || STATUS_STYLES.scheduled;
  const sourceColor = SOURCE_COLORS[appointment.source] || SOURCE_COLORS.default;

  const durationMinutes = useMemo(
    () =>
      Math.max(
        0,
        Math.round(
          (appointment.scheduledEndTime.getTime() - appointment.scheduledStartTime.getTime()) / 60000
        )
      ),
    [appointment.scheduledEndTime, appointment.scheduledStartTime]
  );

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);

    // Store appointment data in drag event
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('appointment-id', appointment.id);
    e.dataTransfer.setData('appointment-data', JSON.stringify(appointment));

    // Add semi-transparent drag image
    if (e.currentTarget instanceof HTMLElement) {
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.7';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={appointment.status !== 'completed' && appointment.status !== 'cancelled'}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'absolute left-0 right-0 mx-1',
        'rounded-lg overflow-hidden',
        'cursor-move transition-all duration-200',
        'shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:z-20',
        'border-l-4',
        isDragging && 'opacity-50 scale-95',
        className
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        borderLeftColor: sourceColor,
      }}
      onClick={onClick}
    >
      <div
        className={cn(
          'h-full p-2.5 relative bg-white border border-gray-200',
          'rounded-lg',
          'flex flex-col gap-1'
        )}
      >
        <div className="flex items-start gap-2">
          <div
            className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-semibold border border-teal-100"
            aria-hidden
          >
            {getInitials(appointment.clientName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {appointment.clientName}
                </span>
                {appointment.status === 'confirmed' && (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden />
                )}
              </div>
              <div
                className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{
                  color: statusStyle.fg,
                  backgroundColor: statusStyle.bg,
                  borderColor: statusStyle.border,
                }}
              >
                {statusStyle.label}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-600">
              <span>{formatTimeDisplay(appointment.scheduledStartTime)}</span>
              <span className="text-gray-300">•</span>
              <span className="font-medium">
                {formatDurationDisplay(durationMinutes)}
              </span>
              {appointment.clientPhone && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="truncate">{appointment.clientPhone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {appointment.services.slice(0, 3).map((service, idx) => (
            <span
              key={idx}
              className="px-2 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200 truncate"
            >
              {service.serviceName}
            </span>
          ))}
          {appointment.services.length > 3 && (
            <span className="px-2 py-1 rounded-full text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-100">
              +{appointment.services.length - 3} more
            </span>
          )}
        </div>

        <div className="absolute inset-y-2 right-2 flex flex-col justify-end gap-1 text-[10px] items-end">
          {/* Sync status indicator */}
          {appointment.syncStatus === 'pending' && (
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Syncing
            </span>
          )}
          {appointment.syncStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Sync error
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
