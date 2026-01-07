import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  isGroup?: boolean;
  groupSize?: number;
}

export const AvailabilityCalendar = ({
  selectedDate,
  onDateSelect,
  isGroup,
  groupSize,
}: AvailabilityCalendarProps) => {
  // Mock availability data - in production, this would come from API
  const getAvailabilityForDate = (date: Date): 'high' | 'medium' | 'low' | 'none' => {
    const day = date.getDay();
    
    // Mock logic: weekends have lower availability
    if (day === 0 || day === 6) {
      return 'low';
    }
    
    // For groups, reduce availability
    if (isGroup && groupSize && groupSize > 3) {
      return 'medium';
    }
    
    return 'high';
  };

  const modifiers = {
    highAvailability: (date: Date) => getAvailabilityForDate(date) === 'high',
    mediumAvailability: (date: Date) => getAvailabilityForDate(date) === 'medium',
    lowAvailability: (date: Date) => getAvailabilityForDate(date) === 'low',
  };

  const modifiersClassNames = {
    highAvailability: 'after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-green-500 after:rounded-full',
    mediumAvailability: 'after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-yellow-500 after:rounded-full',
    lowAvailability: 'after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-red-500 after:rounded-full',
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="rounded-lg border"
      />
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Many slots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <span>Limited</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span>Few left</span>
        </div>
      </div>
    </div>
  );
};
