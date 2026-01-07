import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingFormData, Staff } from '@/types/booking';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingFormData;
  onConfirm: (updatedBooking: BookingFormData) => void;
}

export const RescheduleModal = ({ open, onOpenChange, booking, onConfirm }: RescheduleModalProps) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>(booking);
  const [isProcessing, setIsProcessing] = useState(false);

  const isSameAsOriginal = 
    formData.date === booking.date && 
    formData.time === booking.time && 
    formData.staff?.id === booking.staff?.id;

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleConfirm = () => {
    if (isSameAsOriginal) {
      toast({
        title: 'No changes made',
        description: 'Please select a different date, time, or staff member',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.date || !formData.time || !formData.staff) {
      toast({
        title: 'Missing information',
        description: 'Please select date, time, and staff member',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const updatedBooking: BookingFormData = {
        ...booking,
        ...formData,
      } as BookingFormData;
      
      onConfirm(updatedBooking);
      setIsProcessing(false);
      onOpenChange(false);
      
      toast({
        title: 'Booking rescheduled',
        description: `Your booking has been moved to ${format(new Date(formData.date!), 'MMM d, yyyy')} at ${formData.time}`,
      });
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            Choose a new date and time for your appointment
          </DialogDescription>
        </DialogHeader>

        {/* Original Booking Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Current Booking:</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {booking.date && format(new Date(booking.date), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {booking.time}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Cancellation Policy */}
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
            Free rescheduling up to 24 hours before your appointment. Rescheduling within 24 hours may incur a fee.
          </AlertDescription>
        </Alert>

        {/* Info about selecting new time */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Please select a new date and time for your appointment. The booking flow will guide you through the process.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSameAsOriginal || isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
