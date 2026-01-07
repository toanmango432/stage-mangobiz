import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIBadgeProps {
  variant?: 'subtle' | 'prominent' | 'chip';
  className?: string;
  children?: React.ReactNode;
}

export function AIBadge({ variant = 'subtle', className, children }: AIBadgeProps) {
  if (variant === 'chip') {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
        "border border-purple-500/20",
        "text-xs font-medium text-purple-700 dark:text-purple-300",
        "animate-fade-in",
        className
      )}>
        <Sparkles className="h-3 w-3" />
        {children || 'AI Recommended'}
      </div>
    );
  }

  if (variant === 'prominent') {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
        "bg-gradient-to-r from-purple-500/20 to-pink-500/20",
        "border border-purple-500/30",
        "text-sm font-semibold text-purple-800 dark:text-purple-200",
        "shadow-sm animate-fade-in",
        className
      )}>
        <Sparkles className="h-4 w-4 animate-pulse" />
        {children || 'Suggested by Mango AI'}
      </div>
    );
  }

  // Subtle variant (default)
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs text-muted-foreground",
      "animate-fade-in",
      className
    )}>
      <Sparkles className="h-3 w-3 text-purple-500" />
      {children || 'AI'}
    </span>
  );
}
