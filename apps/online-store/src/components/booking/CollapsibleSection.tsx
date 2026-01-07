import { ReactNode, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  step: string;
  icon: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  isComplete?: boolean;
  completedLabel?: string;
}

export const CollapsibleSection = ({
  title,
  step,
  icon,
  children,
  defaultExpanded = false,
  isComplete = false,
  completedLabel,
}: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            isComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {isComplete ? <Check className="h-5 w-5" /> : icon}
          </div>
          <div className="text-left">
            <div className="text-sm text-muted-foreground">{step}</div>
            <div className="font-semibold text-foreground">{title}</div>
            {isComplete && completedLabel && (
              <div className="text-sm text-muted-foreground mt-0.5">{completedLabel}</div>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            isExpanded && "transform rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-6 py-4 border-t border-border animate-accordion-down">
          {children}
        </div>
      )}
    </Card>
  );
};
