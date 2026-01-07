import { BookingFormData } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { TimeSlotGrid } from './TimeSlotGrid';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

interface DateTimeStepProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onContinue: () => void;
}

export const DateTimeStep = ({ formData, updateFormData, onContinue }: DateTimeStepProps) => {
  const calculateTotalDuration = () => {
    const serviceDuration = formData.service?.duration || 0;
    const addOnsDuration = (formData.addOns || []).reduce((sum, addon) => sum + addon.duration, 0);
    return serviceDuration + addOnsDuration;
  };

  const totalDuration = calculateTotalDuration();

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Duration Needed</div>
              <div className="text-xs text-muted-foreground">{totalDuration} minutes total</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{formData.service?.name}</div>
            {formData.addOns && formData.addOns.length > 0 && (
              <div className="text-xs text-muted-foreground">+ {formData.addOns.length} add-on(s)</div>
            )}
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Select Date</h3>
        </div>
        <AvailabilityCalendar
          selectedDate={formData.date ? new Date(formData.date) : undefined}
          onDateSelect={(date) => {
            updateFormData({ date: date.toISOString().split('T')[0], time: undefined });
          }}
        />
      </Card>

      {/* Time Slots */}
      {formData.date && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Select Time</h3>
          </div>
          <TimeSlotGrid
            date={formData.date}
            selectedTime={formData.time}
            onTimeSelect={(time) => updateFormData({ time })}
            serviceDuration={totalDuration}
          />
        </Card>
      )}

      {/* Continue Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={onContinue}
        disabled={!formData.date || !formData.time}
      >
        Continue to Specialist Selection →
      </Button>
    </div>
  );
};
