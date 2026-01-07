import { Button } from '@/components/ui/button';
import { Sun, Sunset, Moon } from 'lucide-react';
import { TimeSlot, getAvailableSlots } from '@/lib/utils/availability';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface TimeSlotGridProps {
  date?: string;
  slots?: TimeSlot[];
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  onJoinWaitlist?: () => void;
  serviceDuration?: number;
  isGroup?: boolean;
  groupSize?: number;
  schedulingPreference?: any;
}

export const TimeSlotGrid = ({ 
  date,
  slots: propSlots, 
  selectedTime, 
  onTimeSelect,
  onJoinWaitlist,
  serviceDuration = 30
}: TimeSlotGridProps) => {
  // Calculate slots from date if provided, otherwise use propSlots
  const slots = useMemo(() => {
    if (date) {
      return getAvailableSlots(new Date(date), 'any', serviceDuration);
    }
    return propSlots || [];
  }, [date, propSlots, serviceDuration]);

  const morningSlots = slots.filter(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    const isPM = slot.time.includes('PM');
    return !isPM || (isPM && hour === 12);
  });

  const afternoonSlots = slots.filter(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    const isPM = slot.time.includes('PM');
    return isPM && hour >= 1 && hour < 5;
  });

  const eveningSlots = slots.filter(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    const isPM = slot.time.includes('PM');
    return isPM && hour >= 5;
  });

  const SlotGroup = ({ 
    title, 
    icon: Icon, 
    slots 
  }: { 
    title: string; 
    icon: any; 
    slots: TimeSlot[] 
  }) => {
    if (slots.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="w-4 h-4" />
          {title}
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <Button
              key={slot.time}
              variant={selectedTime === slot.time ? 'default' : 'outline'}
              size="sm"
              onClick={() => slot.available && onTimeSelect(slot.time)}
              disabled={!slot.available}
              className={cn(
                'h-10',
                selectedTime === slot.time && 'ring-2 ring-primary'
              )}
            >
              {slot.time}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SlotGroup title="Morning" icon={Sun} slots={morningSlots} />
      <SlotGroup title="Afternoon" icon={Sunset} slots={afternoonSlots} />
      <SlotGroup title="Evening" icon={Moon} slots={eveningSlots} />

      {onJoinWaitlist && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onJoinWaitlist}
        >
          Join Waitlist
        </Button>
      )}
    </div>
  );
};
