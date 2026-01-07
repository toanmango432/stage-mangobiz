import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { slotHolds } from '@/lib/utils/slotHolds';

interface AvailabilityIndicatorProps {
  holdId?: string;
  date?: string;
  time?: string;
}

export const AvailabilityIndicator = ({ holdId, date, time }: AvailabilityIndicatorProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!holdId) return;

    const updateTimer = () => {
      const remaining = slotHolds.getTimeRemaining(holdId);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        // Hold expired
        return;
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [holdId]);

  if (!holdId || timeRemaining <= 0) {
    // Check if slot is held by someone else
    if (date && time && slotHolds.isHeld(date, time)) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Reserved
        </Badge>
      );
    }
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <Badge variant="outline" className="gap-1 border-primary text-primary">
      <Clock className="h-3 w-3" />
      Reserved for {minutes}:{seconds.toString().padStart(2, '0')}
    </Badge>
  );
};
