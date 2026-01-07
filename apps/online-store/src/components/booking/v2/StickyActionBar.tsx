import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StickyActionBarProps {
  onAction: () => void;
  actionText: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  onAction,
  actionText,
  disabled = false,
  loading = false,
  variant = 'default',
  className,
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-[100] bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-sm border-t shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <Button 
          onClick={onAction}
          disabled={disabled || loading}
          variant={variant}
          size="lg"
          className={cn(
            "w-full h-14 text-base md:text-lg font-semibold shadow-lg rounded-xl",
            "transition-all duration-300 ease-out",
            "hover:scale-[1.02] active:scale-[0.98]",
            !disabled && "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <span className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Loading...
              </span>
            ) : actionText}
          </span>
        </Button>
      </div>
    </div>
  );
};


