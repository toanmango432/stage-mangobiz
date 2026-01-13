/**
 * Send to Pad Button Component
 * Allows staff to send the current checkout transaction to Mango Pad for customer signature and tip
 *
 * Part of: Mango Pad Integration (US-006)
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tablet, Loader2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectHasConnectedPad } from '@/store/slices/padDevicesSlice';
import { selectStoreId } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { startPadTransaction } from '@/store/slices/padTransactionSlice';
import {
  getMangoPadService,
  type PadTransaction,
  type PadTransactionItem,
} from '@/services/mangoPadService';
import { v4 as uuidv4 } from 'uuid';

export interface SendToPadButtonProps {
  ticketId: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  staffName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    staffName?: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  tipAmount?: number;
  suggestedTips?: number[];
  onSent?: (transactionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_SUGGESTED_TIPS = [15, 18, 20, 25];

export default function SendToPadButton({
  ticketId,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  staffName,
  items,
  subtotal,
  tax,
  discount,
  total,
  suggestedTips = DEFAULT_SUGGESTED_TIPS,
  onSent,
  onError,
  className,
  disabled = false,
}: SendToPadButtonProps) {
  const dispatch = useAppDispatch();
  const hasConnectedPad = useAppSelector(selectHasConnectedPad);
  const storeId = useAppSelector(selectStoreId);
  const [isSending, setIsSending] = useState(false);

  const handleSendToPad = useCallback(async () => {
    if (!hasConnectedPad || isSending || disabled) return;

    setIsSending(true);

    try {
      const mangoPadService = getMangoPadService();

      if (storeId) {
        mangoPadService.setStoreId(storeId);
      }

      const transactionId = uuidv4();

      const padItems: PadTransactionItem[] = items.map((item, index) => ({
        id: `item-${index}`,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        staffName: item.staffName,
      }));

      const transaction: PadTransaction = {
        transactionId,
        ticketId,
        clientId,
        clientName,
        clientEmail,
        clientPhone,
        staffName,
        items: padItems,
        subtotal,
        tax,
        discount,
        total,
        suggestedTips,
      };

      await mangoPadService.sendReadyToPay(transaction);

      dispatch(startPadTransaction({ transactionId, ticketId }));

      dispatch(
        addNotification({
          type: 'success',
          message: 'Sent to Mango Pad',
        })
      );

      onSent?.(transactionId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send to Pad';

      dispatch(
        addNotification({
          type: 'error',
          message: errorMessage,
        })
      );

      onError?.(errorMessage);
    } finally {
      setIsSending(false);
    }
  }, [
    hasConnectedPad,
    isSending,
    disabled,
    storeId,
    ticketId,
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    staffName,
    items,
    subtotal,
    tax,
    discount,
    total,
    suggestedTips,
    dispatch,
    onSent,
    onError,
  ]);

  const isDisabled = !hasConnectedPad || isSending || disabled;
  const buttonText = isSending ? 'Sending...' : 'Send to Pad';

  if (!hasConnectedPad) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={className}>
              <Button
                variant="outline"
                className="w-full h-14 text-base opacity-50 cursor-not-allowed"
                disabled
                data-testid="button-send-to-pad"
              >
                <Tablet className="h-5 w-5 mr-2" />
                {buttonText}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>No Pad connected</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant="outline"
      className={`w-full h-14 text-base border-green-500/50 hover:bg-green-50 hover:border-green-500 dark:hover:bg-green-950 ${className}`}
      onClick={handleSendToPad}
      disabled={isDisabled}
      data-testid="button-send-to-pad"
    >
      {isSending ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : (
        <Tablet className="h-5 w-5 mr-2 text-green-600" />
      )}
      {buttonText}
    </Button>
  );
}
