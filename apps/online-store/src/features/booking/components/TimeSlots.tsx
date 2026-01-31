'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimeSlotGroup } from '../types/booking.types';
import { TimeUtils } from '../utils/timeUtils';

interface TimeSlotsProps {
  timeSlots: TimeSlotGroup[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  loading?: boolean;
}

export const TimeSlots: React.FC<TimeSlotsProps> = ({
  timeSlots,
  selectedTime,
  onTimeSelect,
  loading = false,
}) => {
  // Find best time (first available slot with most staff)
  const bestTime = useMemo(() => {
    if (timeSlots.length === 0) return null;

    let best: { time: string; staffCount: number } | null = null;

    timeSlots.forEach(group => {
      group.slots.forEach(slot => {
        if (slot.available) {
          const staffCount = slot.staffIds.length;
          if (!best || staffCount > best.staffCount) {
            best = { time: slot.time, staffCount };
          }
        }
      });
    });

    return best?.time || null;
  }, [timeSlots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading available times...</p>
        </div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <Card>
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
    <div className="space-y-6">
      {/* Best time recommendation */}
      {bestTime && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              Recommended Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => onTimeSelect(bestTime)}
              className="w-full"
              variant={selectedTime === bestTime ? 'default' : 'outline'}
            >
              {bestTime}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Time slots grouped by time of day */}
      {timeSlots.map((group) => {
        if (group.slots.length === 0) return null;

        return (
          <Card key={group.label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{group.label}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {group.availableCount} available
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
                        'relative',
                        isBest && !isSelected && 'border-primary/50'
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
