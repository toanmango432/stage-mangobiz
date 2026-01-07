import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookingDataService, TimeSlot } from '@/lib/services/bookingDataService';
import { cn } from '@/lib/utils';
import { format, addDays, isToday, isTomorrow, isWeekend } from 'date-fns';
import { Clock, Calendar as CalendarIcon, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface EnhancedDateTimePickerProps {
  selectedService?: any;
  selectedStaff?: any;
  selectedDate?: string;
  selectedTime?: string;
  onDateTimeSelect: (date: string, time: string) => void;
  groupSize?: number;
  className?: string;
}

export const EnhancedDateTimePicker = ({
  selectedService,
  selectedStaff,
  selectedDate,
  selectedTime,
  onDateTimeSelect,
  groupSize = 1,
  className,
}: EnhancedDateTimePickerProps) => {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [popularTimes, setPopularTimes] = useState<string[]>([]);

  // Load available slots when service, staff, or date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedService || !selectedStaff) return;

      setIsLoading(true);
      try {
        const dateStr = selectedCalendarDate.toISOString().split('T')[0];
        const slots = await bookingDataService.getAvailableSlots({
          serviceId: selectedService.id,
          staffId: selectedStaff.id === 'any' ? undefined : selectedStaff.id,
          date: dateStr,
          duration: selectedService.duration || 60,
        });

        setAvailableSlots(slots);
        
        // Calculate popular times (most available slots)
        const timeCounts = slots.reduce((acc, slot) => {
          acc[slot.time] = (acc[slot.time] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const popular = Object.entries(timeCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([time]) => time);
        
        setPopularTimes(popular);
      } catch (error) {
        console.error('Failed to load time slots:', error);
        setAvailableSlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSlots();
  }, [selectedService, selectedStaff, selectedCalendarDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedCalendarDate(date);
      const dateStr = date.toISOString().split('T')[0];
      onDateTimeSelect(dateStr, '');
    }
  };

  const handleTimeSelect = (time: string) => {
    const dateStr = selectedCalendarDate.toISOString().split('T')[0];
    onDateTimeSelect(dateStr, time);
  };

  const getTimeSlots = () => {
    let slots = availableSlots;

    // Filter by time of day
    switch (timeFilter) {
      case 'morning':
        slots = slots.filter(slot => {
          const hour = parseInt(slot.time.split(':')[0]);
          return hour >= 9 && hour < 12;
        });
        break;
      case 'afternoon':
        slots = slots.filter(slot => {
          const hour = parseInt(slot.time.split(':')[0]);
          return hour >= 12 && hour < 17;
        });
        break;
      case 'evening':
        slots = slots.filter(slot => {
          const hour = parseInt(slot.time.split(':')[0]);
          return hour >= 17 && hour < 20;
        });
        break;
    }

    return slots;
  };

  const getDateBadge = (date: Date) => {
    if (isToday(date)) return { text: 'Today', color: 'bg-green-500' };
    if (isTomorrow(date)) return { text: 'Tomorrow', color: 'bg-blue-500' };
    if (isWeekend(date)) return { text: 'Weekend', color: 'bg-purple-500' };
    return null;
  };

  const getTimeSlotStatus = (time: string) => {
    const slot = availableSlots.find(s => s.time === time);
    if (!slot) return 'unavailable';
    if (slot.available) return 'available';
    return 'limited';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const timeSlots = getTimeSlots();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedCalendarDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
            components={{
              Day: ({ date, ...props }) => {
                const badge = getDateBadge(date);
                return (
                  <div className="relative">
                    <div {...props} />
                    {badge && (
                      <Badge 
                        className={cn(
                          'absolute -top-1 -right-1 text-xs',
                          badge.color
                        )}
                      >
                        {badge.text}
                      </Badge>
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Time Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Time
            </CardTitle>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Times</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No available times for this date</p>
              <p className="text-sm">Try selecting a different date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Popular Times */}
              {popularTimes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Popular Times</span>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {popularTimes.map(time => (
                      <Button
                        key={time}
                        size="sm"
                        variant="outline"
                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                        onClick={() => handleTimeSelect(time)}
                      >
                        {formatTime(time)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Time Slots */}
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((slot) => {
                  const status = getTimeSlotStatus(slot.time);
                  const isSelected = selectedTime === slot.time;
                  
                  return (
                    <Button
                      key={slot.time}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        'h-12 text-sm',
                        status === 'unavailable' && 'opacity-50 cursor-not-allowed',
                        status === 'limited' && 'border-yellow-300 text-yellow-700',
                        status === 'available' && 'hover:bg-primary/10'
                      )}
                      disabled={status === 'unavailable'}
                      onClick={() => handleTimeSelect(slot.time)}
                    >
                      <div className="text-center">
                        <div>{formatTime(slot.time)}</div>
                        {status === 'limited' && (
                          <div className="text-xs text-yellow-600">Limited</div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Date/Time Summary */}
      {selectedDate && selectedTime && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">Selected Appointment</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')} at {formatTime(selectedTime)}
                </p>
                {groupSize > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Group booking for {groupSize} people
                  </p>
                )}
              </div>
              <Badge variant="default" className="bg-primary">
                Confirmed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Suggestions */}
      {selectedService && selectedStaff && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">💡 Smart Suggestions</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {isWeekend(selectedCalendarDate) && (
                <p>• Weekend appointments may have higher demand</p>
              )}
              {timeSlots.length < 5 && (
                <p>• Limited availability - book soon to secure your spot</p>
              )}
              {groupSize > 1 && (
                <p>• Group bookings require all members to be available at the same time</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};



