/**
 * EmptyState - Empty/no-data display component with optional action
 *
 * Used to display when a section has no items with a clear message
 * and optional call-to-action button.
 *
 * @example
 * <EmptyState
 *   title="No categories yet"
 *   description="Create your first category to organize services."
 *   actionLabel="Add Category"
 *   onAction={() => openCreateModal()}
 * />
 */

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Inbox, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /** Title - brief description of the empty state */
  title: string;
  /** Description - additional context or instructions */
  description?: string;
  /** Label for the action button */
  actionLabel?: string;
  /** Callback when user clicks the action button */
  onAction?: () => void;
  /** Optional className for styling */
  className?: string;
  /** Optional icon to replace default Inbox icon */
  icon?: React.ReactNode;
  /** Show plus icon on action button (default: true) */
  showActionIcon?: boolean;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
  icon,
  showActionIcon = true,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-12 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-3">
        {icon || <Inbox className="h-6 w-6 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {showActionIcon && <Plus className="mr-2 h-4 w-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
