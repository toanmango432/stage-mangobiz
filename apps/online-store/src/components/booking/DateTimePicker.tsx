import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookingFormData } from '@/types/booking';
import { useAvailability } from '@/hooks/useAvailability';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AvailabilityIndicator } from './AvailabilityIndicator';
import { slotHolds, SlotHold } from '@/lib/utils/slotHolds';

interface DateTimePickerProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
}

export const DateTimePicker = ({ formData, updateFormData, onNext }: DateTimePickerProps) => {
  const serviceDuration = formData.service?.duration || 60;
  const { getAvailability } = useAvailability(serviceDuration);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.date ? new Date(formData.date) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string | undefined>(formData.time);
  const [currentHold, setCurrentHold] = useState<SlotHold | null>(null);

  // Cleanup hold on unmount
  useEffect(() => {
    return () => {
      if (currentHold) {
        slotHolds.release(currentHold.holdId);
      }
    };
  }, [currentHold]);

  const today = startOfDay(new Date());
  const minDate = addDays(today, 0); // Can book same day
  const maxDate = addDays(today, 90); // Up to 90 days in advance

  const availability = selectedDate ? getAvailability(selectedDate) : null;

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(undefined); // Reset time when date changes
    if (date) {
      updateFormData({ date: format(date, 'yyyy-MM-dd'), time: undefined });
    }
  };

  const handleTimeSelect = (time: string) => {
    // Release previous hold if exists
    if (currentHold) {
      slotHolds.release(currentHold.holdId);
    }

    // Create new hold
    const hold = slotHolds.create(
      format(selectedDate!, 'yyyy-MM-dd'),
      time,
      formData.service?.id || ''
    );
    setCurrentHold(hold);
    setSelectedTime(time);
    updateFormData({ time });
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      onNext();
    }
  };

  const groupTimeSlots = () => {
    if (!availability?.timeSlots) return { morning: [], afternoon: [], evening: [] };

    const morning = availability.timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      const isPM = slot.time.includes('PM');
      const hour24 = isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour;
      return hour24 >= 9 && hour24 < 12;
    });

    const afternoon = availability.timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      const isPM = slot.time.includes('PM');
      const hour24 = isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour;
      return hour24 >= 12 && hour24 < 17;
    });

    const evening = availability.timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      const isPM = slot.time.includes('PM');
      const hour24 = isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour;
      return hour24 >= 17;
    });

    return { morning, afternoon, evening };
  };

  const { morning, afternoon, evening } = groupTimeSlots();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Date</h3>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) =>
              isBefore(date, today) || date > maxDate
            }
            className="rounded-lg border shadow-card"
          />
        </div>
      </div>

      {selectedDate && availability && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Select Time</h3>
            {currentHold && (
              <AvailabilityIndicator 
                holdId={currentHold.holdId}
                date={format(selectedDate, 'yyyy-MM-dd')}
                time={selectedTime}
              />
            )}
          </div>
          
          {!availability.isOpen && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We're closed on {availability.dayOfWeek}s. Please select another date.
              </AlertDescription>
            </Alert>
          )}

          {availability.isOpen && availability.fullyBooked && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All time slots are fully booked for this date. Please select another date.
              </AlertDescription>
            </Alert>
          )}

          {availability.isOpen && !availability.fullyBooked && (
            <div className="space-y-6">
              {morning.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Morning (9AM - 12PM)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {morning.map((slot) => {
                      const isHeld = slotHolds.isHeld(
                        format(selectedDate, 'yyyy-MM-dd'),
                        slot.time,
                        currentHold?.holdId
                      );
                      return (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? 'default' : 'outline'}
                          disabled={!slot.available || isHeld}
                          onClick={() => handleTimeSelect(slot.time)}
                          className={cn(
                            'flex flex-col items-center gap-1 h-auto py-3 relative',
                            (!slot.available || isHeld) && 'opacity-50'
                          )}
                        >
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{slot.time}</span>
                          <span className="text-xs opacity-70">to {slot.endTime}</span>
                          {isHeld && (
                            <span className="absolute -top-1 -right-1 text-xs bg-secondary text-secondary-foreground px-1 rounded">
                              Held
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {afternoon.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Afternoon (12PM - 5PM)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {afternoon.map((slot) => {
                      const isHeld = slotHolds.isHeld(
                        format(selectedDate, 'yyyy-MM-dd'),
                        slot.time,
                        currentHold?.holdId
                      );
                      return (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? 'default' : 'outline'}
                          disabled={!slot.available || isHeld}
                          onClick={() => handleTimeSelect(slot.time)}
                          className={cn(
                            'flex flex-col items-center gap-1 h-auto py-3 relative',
                            (!slot.available || isHeld) && 'opacity-50'
                          )}
                        >
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{slot.time}</span>
                          <span className="text-xs opacity-70">to {slot.endTime}</span>
                          {isHeld && (
                            <span className="absolute -top-1 -right-1 text-xs bg-secondary text-secondary-foreground px-1 rounded">
                              Held
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {evening.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Evening (5PM - 8PM)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {evening.map((slot) => {
                      const isHeld = slotHolds.isHeld(
                        format(selectedDate, 'yyyy-MM-dd'),
                        slot.time,
                        currentHold?.holdId
                      );
                      return (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? 'default' : 'outline'}
                          disabled={!slot.available || isHeld}
                          onClick={() => handleTimeSelect(slot.time)}
                          className={cn(
                            'flex flex-col items-center gap-1 h-auto py-3 relative',
                            (!slot.available || isHeld) && 'opacity-50'
                          )}
                        >
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{slot.time}</span>
                          <span className="text-xs opacity-70">to {slot.endTime}</span>
                          {isHeld && (
                            <span className="absolute -top-1 -right-1 text-xs bg-secondary text-secondary-foreground px-1 rounded">
                              Held
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedDate && selectedTime && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleContinue} size="lg">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};
