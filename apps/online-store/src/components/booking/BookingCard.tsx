import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Star, Plus, Minus, Edit3, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileBottomSheet } from './MobileBottomSheet';
import { ServiceQuickPreview } from './ServiceQuickPreview';
import type { Service, Staff } from '@/types/catalog';

interface BookingCardProps {
  service: Service;
  staff?: Staff;
  date?: string;
  time?: string;
  duration?: number;
  price?: number;
  isGroup?: boolean;
  memberName?: string;
  memberIndex?: number;
  onServiceChange?: (service: Service) => void;
  onStaffChange?: (staff: Staff) => void;
  onDateTimeChange?: (date: string, time: string) => void;
  onRemove?: () => void;
  onAddPerson?: () => void;
  className?: string;
  showAddPerson?: boolean;
  isEditable?: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  service,
  staff,
  date,
  time,
  duration,
  price,
  isGroup = false,
  memberName,
  memberIndex = 1,
  onServiceChange,
  onStaffChange,
  onDateTimeChange,
  onRemove,
  onAddPerson,
  className,
  showAddPerson = false,
  isEditable = true,
}) => {
  const [showServicePreview, setShowServicePreview] = useState(false);
  const [showStaffSelection, setShowStaffSelection] = useState(false);

  const formatPrice = (price?: number) => {
    if (!price) return 'Price TBD';
    return `$${price}`;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Duration TBD';
    return `${duration}min`;
  };

  const formatDateTime = () => {
    if (!date || !time) return 'Select time';
    const dateObj = new Date(date);
    const isToday = dateObj.toDateString() === new Date().toDateString();
    const isTomorrow = dateObj.toDateString() === new Date(Date.now() + 86400000).toDateString();
    
    let dateStr = '';
    if (isToday) dateStr = 'Today';
    else if (isTomorrow) dateStr = 'Tomorrow';
    else dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    return `${dateStr} at ${time}`;
  };

  return (
    <>
      <Card className={cn(
        "relative transition-all duration-200 hover:shadow-md",
        isGroup && "border-l-4 border-l-primary",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isGroup && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Person {memberIndex}
                  </span>
                  {memberName && memberName !== `Guest ${memberIndex}` && (
                    <span className="text-sm text-muted-foreground">
                      • {memberName}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight mb-1">
                    {service.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {service.category}
                    </Badge>
                    {service.isPopular && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Popular
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(duration || service.duration)}
                    </div>
                    <div className="font-semibold text-foreground">
                      {formatPrice(price || service.price)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {isEditable && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Service Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Service</span>
              {isEditable && onServiceChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowServicePreview(true)}
                  className="h-8 px-2 text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Change
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {service.description}
            </div>
          </div>
          
          {/* Staff Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Technician</span>
              {isEditable && onStaffChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStaffSelection(true)}
                  className="h-8 px-2 text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Choose
                </Button>
              )}
            </div>
            
            {staff ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={staff.avatar} alt={staff.name} />
                  <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{staff.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{staff.rating}</span>
                    <span>•</span>
                    <span>{staff.specialties[0]}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Any available technician
              </div>
            )}
          </div>
          
          {/* Date & Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Date & Time</span>
              {isEditable && onDateTimeChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {/* TODO: Open date/time picker */}}
                  className="h-8 px-2 text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Change
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDateTime()}
            </div>
          </div>
          
          {/* Add Person Button */}
          {showAddPerson && onAddPerson && (
            <Button
              variant="outline"
              onClick={onAddPerson}
              className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add another person
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Service Preview Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showServicePreview}
        onClose={() => setShowServicePreview(false)}
        title="Select Service"
        initialHeight="lg"
      >
        <ServiceQuickPreview
          selectedService={service}
          onServiceSelect={(newService) => {
            onServiceChange?.(newService);
            setShowServicePreview(false);
          }}
        />
      </MobileBottomSheet>
      
      {/* Staff Selection Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showStaffSelection}
        onClose={() => setShowStaffSelection(false)}
        title="Choose Technician"
        initialHeight="lg"
      >
        <div className="p-6">
          <p className="text-muted-foreground text-sm mb-4">
            Select a technician for this service
          </p>
          {/* TODO: Add staff selection grid */}
          <div className="text-center py-8 text-muted-foreground">
            Staff selection coming soon...
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
};