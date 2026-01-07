import { cn } from '@/lib/utils';

interface AvailabilityDotProps {
  status: 'available' | 'limited' | 'unavailable' | 'unknown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const AvailabilityDot = ({
  status,
  size = 'md',
  showLabel = false,
  className,
}: AvailabilityDotProps) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const statusClasses = {
    available: 'bg-green-500',
    limited: 'bg-yellow-500',
    unavailable: 'bg-red-500',
    unknown: 'bg-gray-400',
  };

  const labelText = {
    available: 'Available',
    limited: 'Limited',
    unavailable: 'Unavailable',
    unknown: 'Unknown',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          statusClasses[status],
          'animate-pulse'
        )}
        title={labelText[status]}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {labelText[status]}
        </span>
      )}
    </div>
  );
};



