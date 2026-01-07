import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
  selectedTime?: string;
  alternativeTimes: Array<{ time: string; endTime: string; available: boolean }>;
  onSelectAlternative: (time: string) => void;
  onCancel: () => void;
}

export const ConflictModal = ({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  alternativeTimes,
  onSelectAlternative,
  onCancel,
}: ConflictModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Time Slot No Longer Available</DialogTitle>
          <DialogDescription>
            The selected time slot at {selectedTime} is no longer available. Please choose from these alternative times:
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your selected time ({selectedTime}) has been booked by another customer.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Alternative Times (±2 hours)</h4>
            {alternativeTimes.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No alternative times available within 2 hours. Please select a different date.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {alternativeTimes.map((slot) => (
                  <Button
                    key={slot.time}
                    variant="outline"
                    disabled={!slot.available}
                    onClick={() => {
                      onSelectAlternative(slot.time);
                      onOpenChange(false);
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 h-auto py-3',
                      !slot.available && 'opacity-50'
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">{slot.time}</span>
                    <span className="text-xs opacity-70">to {slot.endTime}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Choose Different Date
            </Button>
            <Button variant="default" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
