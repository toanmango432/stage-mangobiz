import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const calculateTimeLeft = (endDate: string): TimeLeft => {
  const difference = new Date(endDate).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false,
  };
};

export const CountdownTimer = ({ endDate, compact = false }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.isExpired) {
    return null;
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
        <Clock className="h-3 w-3" />
        <span className="font-medium">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border ${
      isUrgent 
        ? 'bg-destructive/10 border-destructive text-destructive' 
        : 'bg-muted/50 border-border'
    }`}>
      <Clock className="h-4 w-4" />
      <div className="flex items-center gap-2 text-sm font-medium">
        {timeLeft.days > 0 && (
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold leading-none">{timeLeft.days}</span>
            <span className="text-xs opacity-75">days</span>
          </div>
        )}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <>
            {timeLeft.days > 0 && <span className="opacity-50">:</span>}
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold leading-none">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="text-xs opacity-75">hrs</span>
            </div>
          </>
        )}
        <span className="opacity-50">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold leading-none">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs opacity-75">min</span>
        </div>
        <span className="opacity-50">:</span>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold leading-none">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs opacity-75">sec</span>
        </div>
      </div>
    </div>
  );
};
