import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DurationBadgeProps {
  duration: number; // in minutes
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'highlighted';
  className?: string;
}

export const DurationBadge = ({
  duration,
  size = 'md',
  variant = 'default',
  className,
}: DurationBadgeProps) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  };

  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    subtle: 'bg-muted/50 text-muted-foreground/70',
    highlighted: 'bg-primary/10 text-primary',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      <Clock className={iconSizes[size]} />
      <span>{formatDuration(duration)}</span>
    </div>
  );
};



