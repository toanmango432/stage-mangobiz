import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Staff } from '../types/booking.types';

interface StaffCardProps {
  staff: Staff;
  isSelected?: boolean;
  onSelect: (staffId: string) => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  isSelected = false,
  onSelect,
}) => {
  const initials = `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        isSelected && 'ring-2 ring-primary',
        !staff.isAvailable && 'opacity-60 cursor-not-allowed'
      )}
      onClick={() => staff.isAvailable && onSelect(staff.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={staff.avatar} alt={`${staff.firstName} ${staff.lastName}`} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {isSelected && (
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Staff Info */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h3 className="font-semibold text-lg mb-1">
              {staff.firstName} {staff.lastName}
            </h3>

            {/* Nickname */}
            {staff.nickname && staff.nickname !== staff.firstName && (
              <p className="text-sm text-muted-foreground mb-2">
                "{staff.nickname}"
              </p>
            )}

            {/* Rating */}
            {staff.rating && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{staff.rating.toFixed(1)}</span>
              </div>
            )}

            {/* Specialties */}
            {staff.specialties && staff.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {staff.specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {staff.specialties.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{staff.specialties.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Availability Status */}
            {!staff.isAvailable && (
              <Badge variant="destructive" className="text-xs">
                Not Available
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
