import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, Award, Users, Eye, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileBottomSheet } from './MobileBottomSheet';
import { StaffProfileSheet } from './StaffProfileSheet';
import type { Staff } from '@/types/catalog';

interface StaffPersonalityCardProps {
  staff: Staff;
  isSelected?: boolean;
  onSelect?: (staff: Staff) => void;
  onViewProfile?: (staff: Staff) => void;
  className?: string;
  showAvailability?: boolean;
  compact?: boolean;
}

export const StaffPersonalityCard: React.FC<StaffPersonalityCardProps> = ({
  staff,
  isSelected = false,
  onSelect,
  onViewProfile,
  className,
  showAvailability = true,
  compact = false,
}) => {
  const [showProfile, setShowProfile] = useState(false);

  const handleCardClick = () => {
    if (onViewProfile) {
      onViewProfile(staff);
    } else {
      setShowProfile(true);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(staff);
  };

  const getAvailabilityStatus = () => {
    // Mock availability logic - in real app, this would check actual availability
    const isAvailableToday = Math.random() > 0.3;
    const isAvailableNow = Math.random() > 0.7;
    
    if (isAvailableNow) {
      return { text: 'Available now', variant: 'default' as const, color: 'text-green-600' };
    } else if (isAvailableToday) {
      return { text: 'Available today', variant: 'secondary' as const, color: 'text-blue-600' };
    } else {
      return { text: 'Book ahead', variant: 'outline' as const, color: 'text-muted-foreground' };
    }
  };

  const availability = getAvailabilityStatus();

  if (compact) {
    return (
      <>
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md group",
            isSelected && "ring-2 ring-primary bg-primary/5",
            className
          )}
          onClick={handleCardClick}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={staff.avatar} alt={staff.name} />
                <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">{staff.name}</h3>
                  {isSelected && (
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{staff.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{staff.specialties[0]}</span>
                </div>
              </div>
              
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={handleSelect}
                className="h-8 px-3"
              >
                {isSelected ? "Selected" : "Select"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <MobileBottomSheet
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          title="Staff Profile"
          initialHeight="lg"
        >
          <StaffProfileSheet staff={staff} onSelect={onSelect} />
        </MobileBottomSheet>
      </>
    );
  }

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-lg group",
          isSelected && "ring-2 ring-primary bg-primary/5",
          className
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header with Avatar and Basic Info */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={staff.avatar} alt={staff.name} />
                <AvatarFallback className="text-lg font-semibold">
                  {staff.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{staff.name}</h3>
                    <p className="text-sm text-muted-foreground">{staff.title}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{staff.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({staff.reviewCount} reviews)
                    </span>
                  </div>
                </div>
                
                {showAvailability && (
                  <Badge variant={availability.variant} className={availability.color}>
                    {availability.text}
                  </Badge>
                )}
              </div>
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Specialties</h4>
              <div className="flex flex-wrap gap-1">
                {staff.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{staff.totalBookings} bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>{staff.experienceYears} years exp</span>
              </div>
            </div>

            {/* Mini Portfolio Preview */}
            {staff.portfolio && staff.portfolio.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Recent Work</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {staff.portfolio.slice(0, 3).map((image, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={image}
                        alt={`${staff.name} work ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {staff.portfolio.length > 3 && (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{staff.portfolio.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant={isSelected ? "default" : "outline"}
                onClick={handleSelect}
                className="flex-1"
              >
                {isSelected ? "Selected" : "Select"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCardClick}
                className="px-3"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <MobileBottomSheet
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        title="Staff Profile"
        initialHeight="lg"
      >
        <StaffProfileSheet staff={staff} onSelect={onSelect} />
      </MobileBottomSheet>
    </>
  );
};



