import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingFormData } from '@/types/booking';
import { AlertTriangle, DollarSign, CheckCircle2 } from 'lucide-react';
import { differenceInHours, format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingFormData;
  onConfirm: (reason?: string) => void;
}

export const CancelBookingDialog = ({ open, onOpenChange, booking, onConfirm }: CancelBookingDialogProps) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate if cancellation is within 24 hours
  const bookingDateTime = booking.date ? new Date(`${booking.date} ${booking.time}`) : new Date();
  const hoursUntilBooking = differenceInHours(bookingDateTime, new Date());
  const isWithin24Hours = hoursUntilBooking < 24 && hoursUntilBooking > 0;
  
  // Mock calculation - in real app, this would be based on booking value and policy
  const depositAmount = booking.service ? 25 : 0;
  const refundAmount = isWithin24Hours ? 0 : depositAmount;
  const cancellationFee = isWithin24Hours ? depositAmount : 0;

  const handleConfirm = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      onConfirm(reason);
      setIsProcessing(false);
      onOpenChange(false);
      
      toast({
        title: 'Booking cancelled',
        description: refundAmount > 0 
          ? `Your booking has been cancelled. $${refundAmount} will be refunded to your original payment method.`
          : 'Your booking has been cancelled.',
      });
    }, 1000);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Booking
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your booking for{' '}
            {booking.date && format(new Date(booking.date), 'MMM d, yyyy')} at {booking.time}?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Cancellation Policy Alert */}
          {isWithin24Hours ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Late Cancellation Fee</p>
                <p className="text-sm">
                  Cancelling within 24 hours of your appointment will result in a ${cancellationFee} cancellation fee.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <p className="font-medium mb-1">Free Cancellation</p>
                <p className="text-sm">
                  You're cancelling more than 24 hours in advance. No cancellation fee will be charged.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Refund Information */}
          {depositAmount > 0 && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                Refund Details
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original deposit</span>
                  <span>${depositAmount.toFixed(2)}</span>
                </div>
                {cancellationFee > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Cancellation fee</span>
                    <span>-${cancellationFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Refund amount</span>
                  <span className="text-primary">${refundAmount.toFixed(2)}</span>
                </div>
              </div>
              {refundAmount > 0 && (
                <p className="text-xs text-muted-foreground pt-2">
                  Refund will be processed within 5-7 business days
                </p>
              )}
            </div>
          )}

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Help us improve by sharing why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{reason.length}/500 characters</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
