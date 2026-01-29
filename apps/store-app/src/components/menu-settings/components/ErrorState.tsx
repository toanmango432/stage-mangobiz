/**
 * ErrorState - Error display component with retry option
 *
 * Used to display error states with a clear message and optional retry button.
 * Consistent styling with existing menu-settings components.
 *
 * @example
 * <ErrorState
 *   title="Failed to load categories"
 *   message="Please check your connection and try again."
 *   onRetry={() => refetch()}
 * />
 */

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  /** Error title - brief description of what went wrong */
  title: string;
  /** Error message - more detailed explanation or instructions */
  message?: string;
  /** Callback when user clicks retry button */
  onRetry?: () => void;
  /** Optional className for styling */
  className?: string;
  /** Optional icon to replace default AlertCircle */
  icon?: React.ReactNode;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className,
  icon,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12 text-center',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-full bg-destructive/10 p-3">
        {icon || <AlertCircle className="h-6 w-6 text-destructive" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {message && (
          <p className="text-sm text-muted-foreground max-w-md">{message}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
