import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIBadge } from "./ai-badge";

interface AISuggestionBarProps {
  message: string;
  details?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

export function AISuggestionBar({ 
  message, 
  details, 
  action, 
  onDismiss,
  className 
}: AISuggestionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg",
      "bg-gradient-to-r from-purple-50 to-pink-50",
      "dark:from-purple-950/20 dark:to-pink-950/20",
      "border border-purple-200/50 dark:border-purple-800/50",
      "animate-slide-in-right",
      className
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AIBadge variant="subtle" className="mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {message}
            </p>
            
            {details && isExpanded && (
              <p className="mt-2 text-sm text-muted-foreground animate-fade-in">
                {details}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {action && (
              <button
                onClick={action.onClick}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              >
                {action.label}
              </button>
            )}
            
            {details && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
              >
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                aria-label="Dismiss suggestion"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
