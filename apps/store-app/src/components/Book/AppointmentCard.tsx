/**
 * AppointmentCard Component
 * Displays an appointment on the calendar with paper ticket aesthetic
 */

import { memo, useState, useMemo } from 'react';
import { Archive, BadgeCheck, UserCheck, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { formatTimeDisplay, formatDurationDisplay } from '../../utils/timeUtils';
import { StatusBadge } from './StatusBadge';
import { useCatalog } from '../../hooks/useCatalog';
import { useAppSelector } from '../../store/hooks';
import { selectStoreId } from '../../store/slices/authSlice';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface AppointmentCardProps {
  appointment: LocalAppointment;
  top: number;
  height: number;
  onClick?: () => void;
  className?: string;
}


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
  const sourceColor = SOURCE_COLORS[appointment.source] || SOURCE_COLORS.default;

  // Get catalog services for price comparison
  const storeId = useAppSelector(selectStoreId) || 'default-store';
  const { services: catalogServices } = useCatalog({ storeId });

  const durationMinutes = useMemo(
    () =>
      Math.max(
        0,
        Math.round(
          (new Date(appointment.scheduledEndTime).getTime() - new Date(appointment.scheduledStartTime).getTime()) / 60000
        )
      ),
    [appointment.scheduledEndTime, appointment.scheduledStartTime]
  );

  // Check if any service has staffRequested flag
  const hasRequestedStaff = useMemo(
    () => appointment.services.some((service: any) => service.staffRequested === true),
    [appointment.services]
  );

  /**
   * Check if any service has a price variance between booked price and current catalog price.
   * Only shows indicator if:
   * - Service has a bookedPrice (old appointments without bookedPrice are ignored)
   * - Current catalog price differs from bookedPrice
   */
  const hasPriceVariance = useMemo(() => {
    // Don't check if catalog services aren't loaded yet
    if (!catalogServices || catalogServices.length === 0) return false;

    return appointment.services.some((service: any) => {
      // Skip if no bookedPrice (old appointments, walk-ins)
      if (service.bookedPrice === undefined || service.bookedPrice === null) {
        return false;
      }

      // Find the current catalog service
      const catalogService = catalogServices.find(cs => cs.id === service.serviceId);
      if (!catalogService) {
        // Service might have been deleted - don't show variance indicator
        return false;
      }

      // Compare prices with tolerance for floating-point comparison
      const priceDifference = Math.abs(service.bookedPrice - catalogService.price);
      return priceDifference >= 0.01; // $0.01 tolerance
    });
  }, [appointment.services, catalogServices]);

  /**
   * Check if any service in the appointment has been archived.
   * Checks both the appointment service's own status field (if populated)
   * and the current catalog service's status.
   */
  const hasArchivedService = useMemo(() => {
    // Check appointment services for archived status
    const hasArchivedInAppointment = appointment.services.some((service: any) => {
      return service.status === 'archived';
    });

    if (hasArchivedInAppointment) return true;

    // Also check catalog services - if the service is now archived in catalog
    if (!catalogServices || catalogServices.length === 0) return false;

    return appointment.services.some((service: any) => {
      const catalogService = catalogServices.find(cs => cs.id === service.serviceId);
      // If service found in catalog and is archived
      return catalogService?.status === 'archived';
    });
  }, [appointment.services, catalogServices]);

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
            className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-semibold border border-brand-100"
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
                {(appointment.status as any) === 'confirmed' && (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden />
                )}
                {/* Requested Staff Indicator */}
                {hasRequestedStaff && (
                  <span
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold border border-amber-200"
                    title="Staff Requested"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>REQ</span>
                  </span>
                )}
                {/* Price Variance Indicator */}
                {hasPriceVariance && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600 border border-amber-200"
                          aria-label="Price has changed since booking"
                        >
                          <Zap className="w-2.5 h-2.5" aria-hidden />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Price has changed since booking
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* Archived Service Indicator */}
                {hasArchivedService && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 border border-gray-200"
                          aria-label="Contains archived service"
                        >
                          <Archive className="w-2.5 h-2.5" aria-hidden />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Contains archived service
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <StatusBadge
                status={appointment.status as any}
                size="sm"
                showIcon={false}
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-600">
              <span>{formatTimeDisplay(new Date(appointment.scheduledStartTime))}</span>
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
            <span className="px-2 py-1 rounded-full text-[10px] font-semibold text-brand-700 bg-brand-50 border border-brand-100">
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
