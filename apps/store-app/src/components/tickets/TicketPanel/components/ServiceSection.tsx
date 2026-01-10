/**
 * ServiceSection Component
 *
 * Handles service list display and management in the ticket.
 * Shows service status, staff assignment, and allows status changes.
 *
 * Target: <400 lines
 * Current: Placeholder - to be extracted from main TicketPanel
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Play,
  Pause,
  Check,
  X,
  MoreVertical,
  Trash2,
  User,
} from 'lucide-react';
import { SERVICE_STATUS_COLORS } from '../constants';
import type { ServiceSectionProps, TicketService } from '../types';
import type { ServiceStatus } from '@/store/slices/uiTicketsSlice';

export default function ServiceSection({
  services,
  onAddService,
  onRemoveService,
  onUpdateService,
  onStatusChange,
  selectedStaff,
}: ServiceSectionProps) {
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'in_progress':
        return <Play className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      case 'completed':
        return <Check className="h-3 w-3" />;
      case 'cancelled':
        return <X className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getNextStatus = (currentStatus: ServiceStatus): ServiceStatus | null => {
    switch (currentStatus) {
      case 'pending':
        return 'in_progress';
      case 'in_progress':
        return 'completed';
      case 'paused':
        return 'in_progress';
      default:
        return null;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (services.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No services added</p>
          <p className="text-xs mt-1">Select a service to add to this ticket</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-background rounded-lg border p-3 hover:border-primary/50 transition-colors"
            data-testid={`service-item-${service.id}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">
                    {service.serviceName || service.name}
                  </h4>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${SERVICE_STATUS_COLORS[service.status]}`}
                  >
                    {getStatusIcon(service.status)}
                    <span className="ml-1 capitalize">{service.status.replace('_', ' ')}</span>
                  </Badge>
                </div>

                {service.staffName && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {service.staffName}
                  </p>
                )}

                {service.duration && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {service.duration} min
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {formatPrice(service.price)}
                </span>

                {getNextStatus(service.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const next = getNextStatus(service.status);
                      if (next) onStatusChange(service.id, next);
                    }}
                    className="h-8 w-8 p-0"
                    data-testid={`advance-status-${service.id}`}
                  >
                    {service.status === 'pending' && <Play className="h-4 w-4" />}
                    {service.status === 'in_progress' && <Check className="h-4 w-4" />}
                    {service.status === 'paused' && <Play className="h-4 w-4" />}
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {service.status === 'in_progress' && (
                      <DropdownMenuItem onClick={() => onStatusChange(service.id, 'paused')}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                    )}
                    {service.status !== 'completed' && service.status !== 'cancelled' && (
                      <DropdownMenuItem onClick={() => onStatusChange(service.id, 'cancelled')}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onRemoveService(service.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
