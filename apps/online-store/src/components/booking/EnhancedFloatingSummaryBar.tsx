import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar, ChevronUp, ChevronDown, DollarSign, Users, AlertCircle, CheckCircle, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileBottomSheet } from './MobileBottomSheet';
import type { Service, Staff } from '@/types/catalog';

interface EnhancedFloatingSummaryBarProps {
  service?: Service;
  staff?: Staff;
  date?: string;
  time?: string;
  duration?: number;
  price?: number;
  isGroup?: boolean;
  groupSize?: number;
  members?: Array<{
    id: string;
    name: string;
    service?: Service;
    staff?: Staff;
    price?: number;
  }>;
  onContinue: () => void;
  onEdit?: (section: string) => void;
  className?: string;
  isComplete?: boolean;
  hasConflicts?: boolean;
}

export const EnhancedFloatingSummaryBar: React.FC<EnhancedFloatingSummaryBarProps> = ({
  service,
  staff,
  date,
  time,
  duration,
  price,
  isGroup,
  groupSize,
  members,
  onContinue,
  onEdit,
  className,
  isComplete = false,
  hasConflicts = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

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

  const getTotalPrice = () => {
    if (isGroup && members) {
      return members.reduce((total, member) => total + (member.price || 0), 0);
    }
    return price || 0;
  };

  const getTotalDuration = () => {
    if (isGroup && members) {
      return members.reduce((total, member) => total + (member.service?.duration || 0), 0);
    }
    return duration || 0;
  };

  const getSummaryState = () => {
    if (hasConflicts) return 'conflict';
    if (isComplete) return 'complete';
    if (!service) return 'empty';
    if (!date || !time) return 'partial';
    return 'ready';
  };

  const summaryState = getSummaryState();

  const getStateIcon = () => {
    switch (summaryState) {
      case 'conflict': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'empty': return <User className="h-4 w-4 text-muted-foreground" />;
      case 'partial': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStateMessage = () => {
    switch (summaryState) {
      case 'conflict': return 'Time no longer available';
      case 'complete': return 'Ready to book';
      case 'empty': return 'Select a service to start';
      case 'partial': return 'Complete your booking';
      case 'ready': return 'Ready to continue';
      default: return 'Select a service to start';
    }
  };

  const getButtonText = () => {
    switch (summaryState) {
      case 'conflict': return 'Find New Time';
      case 'complete': return 'Confirm Booking';
      case 'empty': return 'Browse Services';
      case 'partial': return 'Continue';
      case 'ready': return 'Continue';
      default: return 'Browse Services';
    }
  };

  const getButtonVariant = () => {
    switch (summaryState) {
      case 'conflict': return 'destructive' as const;
      case 'complete': return 'default' as const;
      case 'empty': return 'outline' as const;
      case 'partial': return 'default' as const;
      case 'ready': return 'default' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <>
      <Card className={cn(
        "fixed bottom-4 left-4 right-4 z-40 shadow-lg border-2 transition-all duration-200",
        "md:bottom-6 md:left-auto md:right-6 md:max-w-sm",
        summaryState === 'conflict' && "border-orange-200 bg-orange-50",
        summaryState === 'complete' && "border-green-200 bg-green-50",
        summaryState === 'empty' && "border-muted",
        summaryState === 'partial' && "border-yellow-200 bg-yellow-50",
        summaryState === 'ready' && "border-primary/20 bg-primary/5",
        className
      )}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Summary Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStateIcon()}
                <h3 className="font-semibold text-sm">{getStateMessage()}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Quick Summary */}
            <div className="space-y-1 text-sm">
              {service && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{service.name}</span>
                </div>
              )}
              
              {staff && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Technician:</span>
                  <span>{staff.name}</span>
                </div>
              )}
              
              {(date && time) && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">When:</span>
                  <span>{formatDateTime()}</span>
                </div>
              )}
              
              {isGroup && groupSize && (
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{groupSize} people</span>
                </div>
              )}
            </div>
            
            {/* Price and Continue */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold">
                  {formatPrice(getTotalPrice())}
                </span>
                {getTotalDuration() > 0 && (
                  <span className="text-sm text-muted-foreground">
                    • {formatDuration(getTotalDuration())}
                  </span>
                )}
              </div>
              <Button 
                onClick={onContinue} 
                variant={getButtonVariant()}
                className="px-6"
              >
                {getButtonText()}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Summary Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Booking Details"
        initialHeight="lg"
      >
        <div className="p-6 space-y-4">
          {/* Service Details */}
          {service && (
            <div className="space-y-2">
              <h4 className="font-semibold">Service</h4>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-background overflow-hidden">
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
                <div className="flex-1">
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(service.duration)} • {formatPrice(service.price)}
                  </div>
                </div>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit('service')}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Staff Details */}
          {staff && (
            <div className="space-y-2">
              <h4 className="font-semibold">Technician</h4>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-12 h-12 rounded-full bg-background overflow-hidden">
                  {staff.avatar ? (
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{staff.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {staff.specialties[0]} • ⭐ {staff.rating}
                  </div>
                </div>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit('staff')}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Date & Time Details */}
          {(date && time) && (
            <div className="space-y-2">
              <h4 className="font-semibold">Date & Time</h4>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{formatDateTime()}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(duration)}
                  </div>
                </div>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit('datetime')}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Group Members */}
          {isGroup && members && members.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Group Members</h4>
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.service?.name} • {formatPrice(member.price || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>
            {getTotalDuration() > 0 && (
              <div className="text-sm text-muted-foreground text-right">
                {formatDuration(getTotalDuration())} total
              </div>
            )}
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
};



