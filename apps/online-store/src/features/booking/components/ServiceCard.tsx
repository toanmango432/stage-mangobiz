import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingService } from '../types/booking.types';
import { TimeUtils } from '../utils/timeUtils';

interface ServiceCardProps {
  service: BookingService;
  isSelected?: boolean;
  onAdd: (service: BookingService) => void;
  onRemove?: (serviceId: string) => void;
  showPrice?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected = false,
  onAdd,
  onRemove,
  showPrice = true,
}) => {
  const handleClick = () => {
    if (isSelected && onRemove) {
      onRemove(service.id);
    } else {
      onAdd(service);
    }
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all hover:shadow-lg',
      isSelected && 'ring-2 ring-primary'
    )}>
      {/* Service Image */}
      {service.imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={service.imageUrl}
            alt={service.title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}

      <CardContent className="p-4">
        {/* Category Badge */}
        <Badge variant="secondary" className="mb-2 text-xs">
          {service.categoryName}
        </Badge>

        {/* Service Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {service.title}
        </h3>

        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Duration and Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{TimeUtils.formatDuration(service.duration)}</span>
          </div>

          {showPrice && (
            <span className="font-bold text-lg">
              ${service.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add-ons indicator */}
        {service.addOns && service.addOns.length > 0 && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              +{service.addOns.length} add-on{service.addOns.length > 1 ? 's' : ''} available
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleClick}
          className="w-full"
          variant={isSelected ? 'secondary' : 'default'}
        >
          {isSelected ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Selected
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
