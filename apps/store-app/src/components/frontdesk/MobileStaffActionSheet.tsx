/**
 * MobileStaffActionSheet - Bottom sheet for mobile staff actions
 * US-011: Mobile-friendly alternative to desktop dropdown menu
 * Features:
 * - Bottom sheet pattern for better mobile UX
 * - Large touch targets (48px minimum)
 * - Haptic feedback on interactions
 * - Actions respect FrontDeskSettings
 */

import { Plus, StickyNote, UserCog, CreditCard, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { haptics } from '../../utils/haptics';

interface MobileStaffActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  staffId: number;
  isBusy: boolean;
  hasActiveTicket: boolean;
  // Action visibility settings
  showAddTicketAction?: boolean;
  showAddNoteAction?: boolean;
  showEditTeamAction?: boolean;
  showQuickCheckoutAction?: boolean;
  // Action callbacks
  onAddTicket?: (staffId: number) => void;
  onAddNote?: (staffId: number) => void;
  onEditTeam?: (staffId: number) => void;
  onQuickCheckout?: (staffId: number) => void;
}

export function MobileStaffActionSheet({
  isOpen,
  onClose,
  staffName,
  staffId,
  isBusy,
  hasActiveTicket,
  showAddTicketAction = true,
  showAddNoteAction = true,
  showEditTeamAction = true,
  showQuickCheckoutAction = true,
  onAddTicket,
  onAddNote,
  onEditTeam,
  onQuickCheckout,
}: MobileStaffActionSheetProps) {
  const handleAction = (action: () => void) => {
    haptics.selection();
    action();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-4">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">{staffName}</SheetTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </SheetHeader>

        <div className="space-y-2">
          {/* Add Ticket Action */}
          {showAddTicketAction && (
            <button
              onClick={() => handleAction(() => onAddTicket?.(staffId))}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Add Ticket</p>
                <p className="text-sm text-gray-500">Create a new ticket for this staff</p>
              </div>
            </button>
          )}

          {/* Add Note Action */}
          {showAddNoteAction && (
            <button
              onClick={() => handleAction(() => onAddNote?.(staffId))}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <StickyNote size={20} className="text-amber-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Add Note</p>
                <p className="text-sm text-gray-500">Add a note for this staff member</p>
              </div>
            </button>
          )}

          {/* Edit Team Member Action */}
          {showEditTeamAction && (
            <button
              onClick={() => handleAction(() => onEditTeam?.(staffId))}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <UserCog size={20} className="text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Edit Team Member</p>
                <p className="text-sm text-gray-500">Update profile and settings</p>
              </div>
            </button>
          )}

          {/* Quick Checkout Action - Only for busy staff with active tickets */}
          {showQuickCheckoutAction && isBusy && hasActiveTicket && (
            <button
              onClick={() => handleAction(() => onQuickCheckout?.(staffId))}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CreditCard size={20} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-emerald-900">Quick Checkout</p>
                <p className="text-sm text-emerald-600">Process payment for current ticket</p>
              </div>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileStaffActionSheet;
