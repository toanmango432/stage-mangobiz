/**
 * Cancel on Pad Button Component
 * Allows staff to cancel an active transaction on Mango Pad.
 *
 * Part of: Mango Pad Integration (US-008)
 */

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActivePadTransaction, setTransactionCancelled, clearPadTransaction } from '@/store/slices/padTransactionSlice';
import { selectStoreId } from '@/store/slices/authSlice';
import { getMangoPadService } from '@/services/mangoPadService';
import { addNotification } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { XCircle, Loader2 } from 'lucide-react';

interface CancelOnPadButtonProps {
  onCancelled?: () => void;
  className?: string;
}

export default function CancelOnPadButton({ onCancelled, className }: CancelOnPadButtonProps) {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector(selectActivePadTransaction);
  const storeId = useAppSelector(selectStoreId);
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!transaction || ['complete', 'failed', 'cancelled'].includes(transaction.status)) {
    return null;
  }

  const handleCancel = async () => {
    if (!transaction || !storeId) return;

    setIsCancelling(true);
    try {
      const mangoPadService = getMangoPadService();
      mangoPadService.setStoreId(storeId);

      await mangoPadService.sendCancel({
        transactionId: transaction.transactionId,
        ticketId: transaction.ticketId,
        reason: 'Cancelled by staff',
      });

      dispatch(setTransactionCancelled({ transactionId: transaction.transactionId }));
      dispatch(
        addNotification({
          type: 'info',
          message: 'Transaction cancelled on Pad',
        })
      );

      setIsOpen(false);
      onCancelled?.();
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to cancel transaction',
        })
      );
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          data-testid="button-cancel-on-pad"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancel on Pad
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Transaction on Pad?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel the current checkout on the customer's Mango Pad and return it to the idle screen.
            The customer will need to start over if they want to complete the payment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>
            Keep Transaction
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={isCancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCancelling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel Transaction'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
