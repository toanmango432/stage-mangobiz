import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Loader2, AlertCircle } from 'lucide-react';
import { BookingFormData } from '@/types/booking';
import { format, parse } from 'date-fns';
import { useState, useMemo } from 'react';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStore';
import { useAvailableSlots } from '@/hooks/queries';

interface DateTimeSelectionSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  groupSize?: number;
}

// Default time slots as fallback
const DEFAULT_MORNING_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
const DEFAULT_EVENING_SLOTS = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'];

// Convert 24h time to 12h format
function formatTime12h(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Parse 12h time to 24h format
function parseTime24h(time12: string): string {
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return time12;
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

export const DateTimeSelectionSection = ({ formData, updateFormData, groupSize = 1 }: DateTimeSelectionSectionProps) => {
  const { storeId } = useStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    formData.date ? parse(formData.date, 'yyyy-MM-dd', new Date()) : undefined
  );

  // Get staff ID (use 'any' as null to fetch general availability)
  const staffId = formData.staff?.id !== 'any' ? formData.staff?.id : undefined;
  const serviceDuration = formData.service?.duration || 30;
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;

  // Fetch available slots when date is selected
  const {
    data: availableSlots,
    isLoading,
    isError,
  } = useAvailableSlots(storeId, staffId, dateStr, serviceDuration);

  // Split slots into morning and evening
  const { morningSlots, eveningSlots } = useMemo(() => {
    if (availableSlots && availableSlots.length > 0) {
      const morning: string[] = [];
      const evening: string[] = [];

      availableSlots.forEach(slot => {
        const [hours] = slot.split(':').map(Number);
        const formatted = formatTime12h(slot);
        if (hours < 12) {
          morning.push(formatted);
        } else {
          evening.push(formatted);
        }
      });

      return { morningSlots: morning, eveningSlots: evening };
    }

    // Fallback to default slots
    return {
      morningSlots: DEFAULT_MORNING_SLOTS,
      eveningSlots: DEFAULT_EVENING_SLOTS,
    };
  }, [availableSlots]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // Clear time when date changes
    if (date) {
      updateFormData({ date: format(date, 'yyyy-MM-dd'), time: undefined });
    }
  };

  const handleTimeSelect = (time: string) => {
    updateFormData({ time });
  };

  const isTimeSelected = (time: string) => formData.time === time;

  return (
    <div className="py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Select Date and Time</h2>

        <div className="grid lg:grid-cols-[400px,1fr] gap-8">
          {/* Calendar */}
          <div className="lg:sticky lg:top-32 self-start">
            <Card className="p-6 shadow-lg">
              <AvailabilityCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-4">Availability</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-orange-500 ring-2 ring-orange-200" />
                    <span className="text-sm text-foreground">Waitlist Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500 ring-2 ring-green-200" />
                    <span className="text-sm text-foreground">Slots Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gray-300 ring-2 ring-gray-200" />
                    <span className="text-sm text-foreground">Fully Booked</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Time Slots */}
          <div>
            {selectedDate ? (
              <div className="space-y-8">
                <Card className="p-4 sm:p-6 shadow-md">
                  <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-foreground">
                    {groupSize > 1 ? `Group of ${groupSize} - ` : ''}Available slots for {format(selectedDate, 'EEE, MMM dd yyyy')}
                  </h3>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading available times...</span>
                    </div>
                  ) : isError ? (
                    <div className="flex items-center gap-2 text-amber-600 py-4">
                      <AlertCircle className="h-5 w-5" />
                      <span>Unable to load availability. Showing default times.</span>
                    </div>
                  ) : null}

                  {/* Morning Slots */}
                  {morningSlots.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Sun className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-lg text-foreground">Morning</span>
                          <p className="text-xs text-muted-foreground">{morningSlots.length} slots available</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {morningSlots.map(slot => (
                          <Button
                            key={slot}
                            variant={isTimeSelected(slot) ? "default" : "outline"}
                            size="lg"
                            onClick={() => handleTimeSelect(slot)}
                            className={cn(
                              "w-full h-12 sm:h-12 font-medium transition-all text-xs sm:text-sm",
                              isTimeSelected(slot) && "shadow-md"
                            )}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evening Slots */}
                  {eveningSlots.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <Moon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-lg text-foreground">Afternoon/Evening</span>
                          <p className="text-xs text-muted-foreground">{eveningSlots.length} slots available</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {eveningSlots.map(slot => (
                          <Button
                            key={slot}
                            variant={isTimeSelected(slot) ? "default" : "outline"}
                            size="lg"
                            onClick={() => handleTimeSelect(slot)}
                            className={cn(
                              "w-full h-12 sm:h-12 font-medium transition-all text-xs sm:text-sm",
                              isTimeSelected(slot) && "shadow-md"
                            )}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No slots available */}
                  {!isLoading && morningSlots.length === 0 && eveningSlots.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No time slots available for this date.</p>
                      <p className="text-sm text-muted-foreground mt-2">Try selecting a different date or technician.</p>
                    </div>
                  )}
                </Card>

                {/* Waitlist & Nearby Locations */}
                <Card className="p-6 bg-muted/30">
                  <div className="space-y-3">
                    <Button variant="outline" size="lg" className="w-full h-12 font-medium hover:bg-background">
                      Join Waitlist for {format(selectedDate, 'MMM dd')}
                    </Button>
                    <Button variant="ghost" size="lg" className="w-full text-primary hover:bg-primary/10">
                      View nearby locations
                    </Button>
                  </div>
                </Card>

                {/* Continue Button */}
                {formData.date && formData.time && (
                  <div className="flex justify-center mt-6">
                    <Button
                      size="lg"
                      className="px-12 h-14 text-lg font-semibold"
                      onClick={() => updateFormData({ readyForSummary: true })}
                    >
                      Continue to Review Booking
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-12 text-center shadow-md">
                <div className="max-w-sm mx-auto">
                  <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl">📅</span>
                  </div>
                  <p className="text-lg text-muted-foreground">Please select a date to view available time slots</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
