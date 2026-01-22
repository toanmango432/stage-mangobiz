/**
 * ConfirmDialog - Accessible confirmation dialog component
 *
 * Replaces browser confirm() calls with a proper dialog that:
 * - Is accessible with proper ARIA labels and focus management
 * - Supports keyboard navigation (Escape to close, Enter to confirm)
 * - Supports loading state for async operations
 * - Provides destructive variant for delete confirmations
 *
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Category"
 *   description="Are you sure you want to delete this category? This action cannot be undone."
 *   onConfirm={handleDelete}
 *   variant="destructive"
 *   confirmLabel="Delete"
 * />
 */

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description/body text */
  description: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Visual variant - 'default' for normal, 'destructive' for delete/danger actions */
  variant?: 'default' | 'destructive';
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Whether the confirm action is loading */
  isLoading?: boolean;
  /** Optional icon to display before the title */
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const handleConfirm = React.useCallback(async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is expected to be done in the onConfirm callback
      console.error('ConfirmDialog: onConfirm error:', error);
    }
  }, [onConfirm, onOpenChange]);

  // Handle Enter key to confirm when dialog is open
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Enter if not loading and no other element has focus that handles Enter
      if (event.key === 'Enter' && !isLoading) {
        const activeElement = document.activeElement;
        const isButtonFocused = activeElement?.tagName === 'BUTTON';
        // If a button is focused, let it handle its own click
        // Otherwise, treat Enter as confirm
        if (!isButtonFocused) {
          event.preventDefault();
          handleConfirm();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, handleConfirm]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Prevent default close behavior
              handleConfirm();
            }}
            disabled={isLoading}
            className={cn(
              variant === 'destructive' &&
                buttonVariants({ variant: 'destructive' })
            )}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
