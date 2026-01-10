/**
 * Pad Transaction Status Component
 * Shows real-time status of transactions sent to Mango Pad.
 *
 * Part of: Mango Pad Integration (US-007)
 */

import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectActivePadTransaction,
  clearPadTransaction,
  type PadTransactionStatus as PadStatus,
} from '@/store/slices/padTransactionSlice';
import { usePadTransactionEvents } from '@/services/mqtt/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Tablet,
  Loader2,
  Check,
  AlertCircle,
  DollarSign,
  PenTool,
  Clock,
  Receipt,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PadTransactionStatusProps {
  ticketId: string;
  onRetry?: () => void;
  className?: string;
}

interface StatusConfig {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  animate?: boolean;
}

function getStatusConfig(
  status: PadStatus,
  tipAmount?: number,
  errorMessage?: string
): StatusConfig {
  switch (status) {
    case 'waiting':
      return {
        icon: <Tablet className="h-5 w-5" />,
        label: 'Waiting for customer...',
        sublabel: 'Customer is viewing the checkout on Pad',
        color: 'text-blue-600 dark:text-blue-400',
        animate: true,
      };
    case 'tip_selected':
      return {
        icon: <DollarSign className="h-5 w-5" />,
        label: `Tip: $${tipAmount?.toFixed(2) || '0.00'} selected`,
        sublabel: 'Awaiting signature...',
        color: 'text-green-600 dark:text-green-400',
      };
    case 'signature':
      return {
        icon: <PenTool className="h-5 w-5" />,
        label: 'Signature captured',
        sublabel: 'Customer is selecting receipt preference...',
        color: 'text-green-600 dark:text-green-400',
      };
    case 'receipt':
      return {
        icon: <Receipt className="h-5 w-5" />,
        label: 'Receipt preference selected',
        sublabel: 'Processing transaction...',
        color: 'text-green-600 dark:text-green-400',
      };
    case 'processing':
      return {
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        label: 'Processing payment...',
        color: 'text-amber-600 dark:text-amber-400',
        animate: true,
      };
    case 'complete':
      return {
        icon: <Check className="h-5 w-5" />,
        label: 'Payment complete',
        sublabel: 'Transaction successful!',
        color: 'text-green-600 dark:text-green-400',
      };
    case 'failed':
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        label: 'Payment failed',
        sublabel: errorMessage || 'An error occurred',
        color: 'text-red-600 dark:text-red-400',
      };
    case 'cancelled':
      return {
        icon: <X className="h-5 w-5" />,
        label: 'Transaction cancelled',
        color: 'text-muted-foreground',
      };
    default:
      return {
        icon: <Clock className="h-5 w-5" />,
        label: 'Ready',
        color: 'text-muted-foreground',
      };
  }
}

function getProgressSteps(status: PadStatus): { label: string; completed: boolean; active: boolean }[] {
  const steps = [
    { label: 'Sent', key: 'waiting' },
    { label: 'Tip', key: 'tip_selected' },
    { label: 'Signature', key: 'signature' },
    { label: 'Complete', key: 'complete' },
  ];

  const statusOrder: PadStatus[] = ['waiting', 'tip_selected', 'signature', 'receipt', 'processing', 'complete'];
  const currentIndex = statusOrder.indexOf(status);

  return steps.map((step, index) => {
    const stepIndex = statusOrder.indexOf(step.key as PadStatus);
    return {
      label: step.label,
      completed: stepIndex < currentIndex || status === 'complete',
      active: step.key === status || (step.key === 'complete' && (status === 'receipt' || status === 'processing')),
    };
  });
}

export default function PadTransactionStatus({
  ticketId,
  onRetry,
  className,
}: PadTransactionStatusProps) {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector(selectActivePadTransaction);

  usePadTransactionEvents();

  if (!transaction || transaction.ticketId !== ticketId) {
    return null;
  }

  const statusConfig = getStatusConfig(
    transaction.status,
    transaction.tipAmount,
    transaction.errorMessage
  );

  const progressSteps = getProgressSteps(transaction.status);
  const showProgress = !['failed', 'cancelled', 'idle'].includes(transaction.status);

  const handleDismiss = () => {
    dispatch(clearPadTransaction());
  };

  return (
    <Card
      className={cn(
        'p-4 border-2',
        transaction.status === 'complete' && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
        transaction.status === 'failed' && 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20',
        transaction.status === 'cancelled' && 'border-muted',
        !['complete', 'failed', 'cancelled'].includes(transaction.status) && 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center',
              transaction.status === 'complete' && 'bg-green-100 dark:bg-green-900/50',
              transaction.status === 'failed' && 'bg-red-100 dark:bg-red-900/50',
              !['complete', 'failed'].includes(transaction.status) && 'bg-blue-100 dark:bg-blue-900/50',
              statusConfig.animate && 'animate-pulse'
            )}
          >
            <span className={statusConfig.color}>{statusConfig.icon}</span>
          </div>
          <div>
            <p className={cn('font-medium', statusConfig.color)}>{statusConfig.label}</p>
            {statusConfig.sublabel && (
              <p className="text-sm text-muted-foreground">{statusConfig.sublabel}</p>
            )}
          </div>
        </div>

        {(transaction.status === 'complete' || transaction.status === 'cancelled') && (
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showProgress && transaction.status !== 'complete' && (
        <div className="mt-4 flex items-center justify-between">
          {progressSteps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                    step.completed && 'bg-green-500 text-white',
                    step.active && !step.completed && 'bg-blue-500 text-white ring-2 ring-blue-300',
                    !step.active && !step.completed && 'bg-muted text-muted-foreground'
                  )}
                >
                  {step.completed ? <Check className="h-3 w-3" /> : index + 1}
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground">{step.label}</span>
              </div>
              {index < progressSteps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 mx-1 mb-4',
                    step.completed ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {transaction.status === 'failed' && onRetry && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDismiss}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </Card>
  );
}
