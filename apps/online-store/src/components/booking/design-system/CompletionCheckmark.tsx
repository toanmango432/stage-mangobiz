import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface CompletionCheckmarkProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const CompletionCheckmark = ({
  size = 'md',
  animated = true,
  className,
}: CompletionCheckmarkProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (animated) {
      setIsVisible(true);
    }
  }, [animated]);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('relative', className)}>
      <CheckCircle
        className={cn(
          'text-green-500',
          sizeClasses[size],
          animated && isVisible && 'animate-bounce',
          'transition-all duration-300 ease-out'
        )}
      />
      
      {animated && (
        <div className="absolute inset-0 animate-ping">
          <CheckCircle
            className={cn(
              'text-green-500 opacity-75',
              sizeClasses[size]
            )}
          />
        </div>
      )}
    </div>
  );
};



