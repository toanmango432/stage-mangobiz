// Grouped Time Slots (Morning/Afternoon/Evening) - from POS
// Integrated with Mango's existing booking system

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string; // "9:00 AM"
  available: boolean;
  staffCount?: number; // Number of staff available
  isBestTime?: boolean;
}

interface TimeGroup {
  label: string; // "Morning", "Afternoon", "Evening"
  icon: React.ReactNode;
  slots: TimeSlot[];
  availableCount: number;
}

interface GroupedTimeSlotsProps {
  timeSlots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  loading?: boolean;
  showBestTime?: boolean;
  className?: string;
}

export const GroupedTimeSlots: React.FC<GroupedTimeSlotsProps> = ({
  timeSlots,
  selectedTime,
  onTimeSelect,
  loading = false,
  showBestTime = true,
  className,
}) => {
  // Group slots by time of day
  const groupedSlots = useMemo((): TimeGroup[] => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    timeSlots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      const isPM = slot.time.includes('PM');
      const hour24 = isPM && hour !== 12 ? hour + 12 : hour;

      if (hour24 < 12) {
        morning.push(slot);
      } else if (hour24 < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return [
      {
        label: 'Morning',
        icon: <Sparkles className="h-4 w-4" />,
        slots: morning,
        availableCount: morning.filter(s => s.available).length,
      },
      {
        label: 'Afternoon',
        icon: <Clock className="h-4 w-4" />,
        slots: afternoon,
        availableCount: afternoon.filter(s => s.available).length,
      },
      {
        label: 'Evening',
        icon: <Star className="h-4 w-4" />,
        slots: evening,
        availableCount: evening.filter(s => s.available).length,
      },
    ].filter(group => group.slots.length > 0);
  }, [timeSlots]);

  // Find best time (most staff available)
  const bestTime = useMemo(() => {
    if (!showBestTime) return null;

    let best: TimeSlot | null = null;
    let maxStaff = 0;

    timeSlots.forEach(slot => {
      if (slot.available && (slot.staffCount || 0) > maxStaff) {
        maxStaff = slot.staffCount || 0;
        best = slot;
      }
    });

    return best?.time || null;
  }, [timeSlots, showBestTime]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading available times...</p>
        </div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Available Times</h3>
          <p className="text-sm text-muted-foreground">
            Please select a different date or contact us directly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Best time recommendation */}
      {bestTime && (
        <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Recommended Time
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onTimeSelect(bestTime)}
              className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
              variant={selectedTime === bestTime ? 'default' : 'outline'}
            >
              {selectedTime === bestTime && <Star className="h-4 w-4 mr-2 fill-current" />}
              {bestTime}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Most staff available at this time
            </p>
          </CardContent>
        </Card>
      )}

      {/* Time slots grouped by time of day */}
      {groupedSlots.map((group) => {
        if (group.slots.length === 0) return null;

        return (
          <Card key={group.label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {group.icon}
                  <span>{group.label}</span>
                </CardTitle>
                <Badge variant="secondary" className="text-xs font-medium">
                  {group.availableCount} available
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {group.slots.map((slot) => {
                  const isBest = slot.time === bestTime;
                  const isSelected = slot.time === selectedTime;

                  return (
                    <Button
                      key={slot.time}
                      onClick={() => onTimeSelect(slot.time)}
                      disabled={!slot.available}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'relative h-11 text-sm font-medium transition-all',
                        isBest && !isSelected && 'border-primary/50 hover:border-primary',
                        isSelected && 'shadow-md'
                      )}
                    >
                      {slot.time}
                      {isBest && !isSelected && (
                        <Star className="absolute -top-1 -right-1 h-3 w-3 fill-primary text-primary" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
