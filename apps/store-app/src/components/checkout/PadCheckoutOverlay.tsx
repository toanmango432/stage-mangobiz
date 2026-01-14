/**
 * Pad Checkout Overlay Component
 * Shows a locked overlay when customer is actively checking out on Mango Pad.
 * Displays real-time screen state and provides staff override controls.
 *
 * Part of: Mango Pad Integration - Phase 1 (Real-time Screen Sync)
 */

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectActivePadTransaction,
  selectCurrentPadScreen,
  selectCustomerStarted,
  clearPadTransaction,
} from '@/store/slices/padTransactionSlice';
import type { PadScreen } from '@/services/mqtt/types';
import { getMangoPadService } from '@/services/mangoPadService';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import {
  Tablet,
  Loader2,
  Check,
  DollarSign,
  PenTool,
  Receipt,
  CreditCard,
  SkipForward,
  AlertCircle,
  X,
  Eye,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PadCheckoutOverlayProps {
  ticketId: string;
  onCancelled?: () => void;
  className?: string;
}

interface ScreenConfig {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  skipAction?: 'skip_tip' | 'skip_signature';
  skipLabel?: string;
}

function getScreenConfig(screen: PadScreen): ScreenConfig {
  switch (screen) {
    case 'waiting':
      return {
        icon: <Eye className="h-6 w-6" />,
        label: 'Waiting for Customer',
        sublabel: 'Transaction sent to Mango Pad',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      };
    case 'order-review':
      return {
        icon: <Receipt className="h-6 w-6" />,
        label: 'Reviewing Order',
        sublabel: 'Customer is reviewing items and totals',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      };
    case 'tip':
      return {
        icon: <DollarSign className="h-6 w-6" />,
        label: 'Selecting Tip',
        sublabel: 'Customer is choosing tip amount',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
        skipAction: 'skip_tip',
        skipLabel: 'Skip Tip',
      };
    case 'signature':
      return {
        icon: <PenTool className="h-6 w-6" />,
        label: 'Signing',
        sublabel: 'Customer is adding signature',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/50',
        skipAction: 'skip_signature',
        skipLabel: 'Skip Signature',
      };
    case 'payment':
      return {
        icon: <CreditCard className="h-6 w-6" />,
        label: 'Processing Payment',
        sublabel: 'Customer is inserting/tapping card',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/50',
      };
    case 'receipt':
      return {
        icon: <Receipt className="h-6 w-6" />,
        label: 'Receipt Preference',
        sublabel: 'Customer is selecting receipt option',
        color: 'text-cyan-600 dark:text-cyan-400',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/50',
      };
    case 'processing':
      return {
        icon: <Loader2 className="h-6 w-6 animate-spin" />,
        label: 'Finalizing',
        sublabel: 'Transaction being processed',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/50',
      };
    case 'complete':
      return {
        icon: <Check className="h-6 w-6" />,
        label: 'Complete',
        sublabel: 'Transaction successful!',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/50',
      };
    case 'failed':
      return {
        icon: <AlertCircle className="h-6 w-6" />,
        label: 'Failed',
        sublabel: 'Transaction failed',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/50',
      };
    case 'cancelled':
      return {
        icon: <X className="h-6 w-6" />,
        label: 'Cancelled',
        sublabel: 'Transaction was cancelled',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
      };
    default:
      return {
        icon: <Tablet className="h-6 w-6" />,
        label: 'Connected',
        sublabel: 'Mango Pad is connected',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
      };
  }
}

const SCREEN_STEPS: { screen: PadScreen; label: string }[] = [
  { screen: 'order-review', label: 'Review' },
  { screen: 'tip', label: 'Tip' },
  { screen: 'signature', label: 'Sign' },
  { screen: 'payment', label: 'Pay' },
  { screen: 'receipt', label: 'Receipt' },
  { screen: 'complete', label: 'Done' },
];

function getStepIndex(screen: PadScreen): number {
  const idx = SCREEN_STEPS.findIndex((s) => s.screen === screen);
  if (idx >= 0) return idx;
  // Special mappings
  if (screen === 'waiting') return -1;
  if (screen === 'processing') return 3; // Same as payment
  return -1;
}

export default function PadCheckoutOverlay({
  ticketId,
  onCancelled,
  className,
}: PadCheckoutOverlayProps) {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector(selectActivePadTransaction);
  const currentScreen = useAppSelector(selectCurrentPadScreen);
  const customerStarted = useAppSelector(selectCustomerStarted);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Don't render if no active transaction for this ticket
  if (!transaction || transaction.ticketId !== ticketId) {
    return null;
  }

  // Don't show overlay for terminal states
  if (['complete', 'failed', 'cancelled'].includes(transaction.status)) {
    return null;
  }

  const screenConfig = getScreenConfig(currentScreen);
  const currentStepIndex = getStepIndex(currentScreen);

  const handleSkip = async (action: 'skip_tip' | 'skip_signature') => {
    if (!transaction.transactionId) return;

    setIsSkipping(true);
    try {
      const service = getMangoPadService();
      if (action === 'skip_tip') {
        await service.skipTip(transaction.transactionId);
      } else {
        await service.skipSignature(transaction.transactionId);
      }
    } catch {
      toast.error('Failed to skip step. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  const handleCancel = async () => {
    if (!transaction.transactionId) return;

    setIsCancelling(true);
    try {
      const service = getMangoPadService();
      await service.cancelTransaction(ticketId, transaction.transactionId);
      dispatch(clearPadTransaction());
      onCancelled?.();
    } catch {
      toast.error('Failed to cancel transaction. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <Card className="w-full max-w-md mx-4 p-6 shadow-2xl border-2 border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center',
                screenConfig.bgColor
              )}
            >
              <Tablet className={cn('h-6 w-6', screenConfig.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Checkout in Progress</h3>
              <p className="text-sm text-muted-foreground">on Mango Pad</p>
            </div>
          </div>
          {customerStarted && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
              <User className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Customer Active
              </span>
            </div>
          )}
        </div>

        {/* Current Screen Status */}
        <div
          className={cn(
            'p-4 rounded-lg mb-6 flex items-center gap-4',
            screenConfig.bgColor.replace('100', '50').replace('900/50', '900/20')
          )}
        >
          <div
            className={cn(
              'h-14 w-14 rounded-full flex items-center justify-center',
              screenConfig.bgColor,
              currentScreen === 'processing' && 'animate-pulse'
            )}
          >
            <span className={screenConfig.color}>{screenConfig.icon}</span>
          </div>
          <div className="flex-1">
            <p className={cn('font-semibold text-lg', screenConfig.color)}>
              {screenConfig.label}
            </p>
            <p className="text-sm text-muted-foreground">{screenConfig.sublabel}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {SCREEN_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <div key={step.screen} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                      isCompleted && 'bg-green-500 text-white',
                      isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                      isFuture && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] mt-1',
                      isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${Math.max(0, ((currentStepIndex + 1) / SCREEN_STEPS.length) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Staff Actions */}
        <div className="space-y-3">
          {/* Skip action if available */}
          {screenConfig.skipAction && (
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => handleSkip(screenConfig.skipAction!)}
              disabled={isSkipping}
            >
              {isSkipping ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SkipForward className="h-4 w-4 mr-2" />
              )}
              {screenConfig.skipLabel}
            </Button>
          )}

          {/* Cancel button */}
          <Button
            variant="ghost"
            className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Cancel Transaction
          </Button>
        </div>

        {/* Info footer */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          Customer is checking out on Mango Pad. Changes to this ticket are locked.
        </p>
      </Card>
    </div>
  );
}
