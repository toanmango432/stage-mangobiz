/**
 * Cancel on Pad Button Component
 * Allows staff to cancel an active transaction on Mango Pad.
 *
 * Part of: Mango Pad Integration (US-008)
 *
 * Uses two-click confirmation pattern instead of AlertDialog
 * to avoid nested modal issues with Radix UI portals.
 */

import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActivePadTransaction, setTransactionCancelled, clearPadTransaction } from '@/store/slices/padTransactionSlice';
import { selectStoreId } from '@/store/slices/authSlice';
import { getMangoPadService } from '@/services/mangoPadService';
import { addNotification } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/Button';
import { XCircle, Loader2, Check } from 'lucide-react';

interface CancelOnPadButtonProps {
  onCancelled?: () => void;
  className?: string;
}

export default function CancelOnPadButton({ onCancelled, className }: CancelOnPadButtonProps) {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector(selectActivePadTransaction);
  const storeId = useAppSelector(selectStoreId);
  const [confirmMode, setConfirmMode] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset confirm mode after 3 seconds
  useEffect(() => {
    if (confirmMode) {
      timeoutRef.current = setTimeout(() => {
        setConfirmMode(false);
      }, 3000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [confirmMode]);

  if (!transaction || ['complete', 'failed', 'cancelled'].includes(transaction.status)) {
    return null;
  }

  const handleFirstClick = () => {
    setConfirmMode(true);
  };

  const handleConfirmCancel = async () => {
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
      dispatch(clearPadTransaction());
      dispatch(
        addNotification({
          type: 'info',
          message: 'Transaction cancelled on Pad',
        })
      );

      setConfirmMode(false);
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

  if (isCancelling) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={className}
        data-testid="button-cancel-on-pad"
      >
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Cancelling...
      </Button>
    );
  }

  if (confirmMode) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmMode(false)}
          data-testid="button-cancel-on-pad-keep"
        >
          Keep
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleConfirmCancel}
          data-testid="button-cancel-on-pad-confirm"
        >
          <Check className="h-4 w-4 mr-1" />
          Yes, Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFirstClick}
      className={className}
      data-testid="button-cancel-on-pad"
    >
      <XCircle className="h-4 w-4 mr-2" />
      Cancel on Pad
    </Button>
  );
}
