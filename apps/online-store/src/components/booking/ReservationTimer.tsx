import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { slotHolds } from '@/lib/utils/slotHolds';

interface ReservationTimerProps {
  holdId: string;
  onExpire: () => void;
}

export const ReservationTimer = ({ holdId, onExpire }: ReservationTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      const remaining = slotHolds.getTimeRemaining(holdId);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdId, onExpire]);

  const formatTime = () => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (timeRemaining === 0) {
    return null;
  }

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-900 dark:text-orange-100">
        <strong>Your reservation will expire in {formatTime()}</strong>
      </AlertDescription>
    </Alert>
  );
};
