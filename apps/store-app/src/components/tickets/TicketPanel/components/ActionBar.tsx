/**
 * ActionBar Component
 *
 * Bottom action bar for the ticket panel with primary actions
 * like checkout, save draft, split, merge, and clear.
 *
 * Target: <200 lines
 * Current: Placeholder - to be extracted from main TicketPanel
 */

import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CreditCard,
  Save,
  Trash2,
  MoreHorizontal,
  Split,
  Merge,
  Loader2,
} from 'lucide-react';
import type { ActionBarProps } from '../types';

export default function ActionBar({
  canCheckout,
  canSaveDraft,
  onCheckout,
  onSaveDraft,
  onClearTicket,
  onSplitTicket,
  onMergeTickets,
  isProcessing = false,
}: ActionBarProps) {
  return (
    <div
      className="border-t bg-background p-4 flex items-center gap-2"
      data-testid="action-bar"
    >
      {/* Primary Action - Checkout */}
      <Button
        className="flex-1"
        size="lg"
        onClick={onCheckout}
        disabled={!canCheckout || isProcessing}
        data-testid="checkout-button"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Checkout
          </>
        )}
      </Button>

      {/* Save Draft Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={onSaveDraft}
        disabled={!canSaveDraft || isProcessing}
        data-testid="save-draft-button"
      >
        <Save className="h-5 w-5" />
      </Button>

      {/* More Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            disabled={isProcessing}
            data-testid="more-actions-button"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onSplitTicket} disabled={!canCheckout}>
            <Split className="h-4 w-4 mr-2" />
            Split Ticket
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMergeTickets}>
            <Merge className="h-4 w-4 mr-2" />
            Merge Tickets
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onClearTicket}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Ticket
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
