/**
 * AppointmentCard Component
 * Displays an appointment on the calendar with paper ticket aesthetic
 */

import { memo } from 'react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { APPOINTMENT_STATUS_COLORS, BOOKING_SOURCE_COLORS } from '../../constants/appointment';
import { formatTimeDisplay, formatDurationDisplay } from '../../utils/timeUtils';
import { StatusBadge } from './StatusBadge';

interface AppointmentCardProps {
  appointment: LocalAppointment;
  top: number;
  height: number;
  onClick?: () => void;
  className?: string;
}

export const AppointmentCard = memo(function AppointmentCard({
  appointment,
  top,
  height,
  onClick,
  className,
}: AppointmentCardProps) {
  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status] || APPOINTMENT_STATUS_COLORS.scheduled;
  const sourceColor = BOOKING_SOURCE_COLORS[appointment.source] || BOOKING_SOURCE_COLORS['walk-in'];

  return (
    <div
      className={cn(
        'absolute left-0 right-0 mx-1',
        'rounded-lg overflow-hidden',
        'cursor-pointer transition-all duration-200',
        'shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:z-20',
        'border-l-4',
        className
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        borderLeftColor: `var(--${sourceColor})`,
      }}
      onClick={onClick}
    >
      {/* Paper ticket background with subtle texture */}
      <div className={cn(
        'h-full p-2 relative',
        'bg-white',
        statusColor,
        'border border-gray-200'
      )}>
        {/* Semicircle cutouts (paper ticket aesthetic) */}
        <div className="absolute -left-1 top-2 w-2 h-2 bg-gray-100 rounded-full" />
        <div className="absolute -left-1 bottom-2 w-2 h-2 bg-gray-100 rounded-full" />
        
        {/* Content */}
        <div className="flex flex-col h-full text-xs">
          {/* Client name */}
          <div className="font-semibold text-gray-900 truncate">
            {appointment.clientName}
          </div>

          {/* Phone number */}
          {appointment.clientPhone && (
            <div className="text-gray-600 text-[10px] truncate">
              {appointment.clientPhone}
            </div>
          )}

          {/* Perforation line */}
          <div className="border-t border-dashed border-gray-300 my-1" />

          {/* Services */}
          <div className="flex-1 overflow-hidden">
            {appointment.services.slice(0, 2).map((service, idx) => (
              <div key={idx} className="text-[10px] text-gray-700 truncate">
                • {service.serviceName}
              </div>
            ))}
            {appointment.services.length > 2 && (
              <div className="text-[10px] text-gray-500">
                +{appointment.services.length - 2} more
              </div>
            )}
          </div>

          {/* Time & Duration */}
          <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1">
            <span>{formatTimeDisplay(appointment.scheduledStartTime)}</span>
            <span className="font-medium">
              {formatDurationDisplay(
                Math.round(
                  (appointment.scheduledEndTime.getTime() - 
                   appointment.scheduledStartTime.getTime()) / 60000
                )
              )}
            </span>
          </div>

          {/* Status badge (if not scheduled) */}
          {appointment.status !== 'scheduled' && (
            <div className={cn(
              'absolute top-1 right-1',
              'px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase',
              statusColor
            )}>
              {appointment.status}
            </div>
          )}

          {/* Sync status indicator */}
          {appointment.syncStatus === 'pending' && (
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" 
                 title="Syncing..." />
          )}
          {appointment.syncStatus === 'error' && (
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-red-500 rounded-full" 
                 title="Sync error" />
          )}
        </div>
      </div>
    </div>
  );
});
