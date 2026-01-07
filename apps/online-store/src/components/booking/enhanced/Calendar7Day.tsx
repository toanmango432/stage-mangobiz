// Enhanced 7-Day Calendar Strip (from POS)
// Integrated with Mango's existing booking system

import React, { useState, useMemo } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface OffDay {
  date: string; // "YYYY-MM-DD"
  reason?: string;
}

interface Calendar7DayProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  offDays?: OffDay[];
  staffOffDays?: OffDay[];
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const Calendar7Day: React.FC<Calendar7DayProps> = ({
  selectedDate,
  onDateSelect,
  offDays = [],
  staffOffDays = [],
  minDate = new Date(),
  maxDate,
  className,
}) => {
  const [weekStart, setWeekStart] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Generate 7 days starting from weekStart
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Combine all off days
  const allOffDays = useMemo(() => {
    return [...offDays, ...staffOffDays];
  }, [offDays, staffOffDays]);

  // Check if a date is off
  const isOffDay = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allOffDays.some(off => off.date === dateStr);
  };

  // Check if date is in the past
  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is selected
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return isSameDay(date, selectedDate);
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  };

  // Check if date is disabled
  const isDisabled = (date: Date): boolean => {
    if (isPast(date)) return true;
    if (isOffDay(date)) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handlePrevWeek = () => {
    setWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(prev => addDays(prev, 7));
  };

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return;
    onDateSelect(date);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    if (isDisabled(date)) return;
    
    onDateSelect(date);
    setWeekStart(date);
    setCalendarOpen(false);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-semibold">{format(weekStart, 'MMMM yyyy')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <ShadcnCalendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleCalendarSelect}
              disabled={(date) => isDisabled(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, index) => {
          const disabled = isDisabled(date);
          const selected = isSelected(date);
          const today = isToday(date);
          const off = isOffDay(date);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all',
                'hover:border-primary hover:bg-primary/5 hover:shadow-md',
                selected && 'border-primary bg-primary text-primary-foreground hover:bg-primary shadow-lg scale-105',
                today && !selected && 'border-primary/50 bg-primary/10',
                disabled && 'opacity-40 cursor-not-allowed hover:border-border hover:bg-transparent hover:shadow-none',
                !selected && !disabled && 'border-border'
              )}
            >
              {/* Day of week */}
              <span className={cn(
                'text-xs font-semibold uppercase mb-1 tracking-wide',
                selected ? 'text-primary-foreground' : 'text-muted-foreground'
              )}>
                {format(date, 'EEE')}
              </span>

              {/* Date */}
              <span className={cn(
                'text-2xl font-bold mb-1',
                selected && 'text-primary-foreground'
              )}>
                {format(date, 'd')}
              </span>

              {/* Status badges */}
              <div className="flex flex-col gap-1 items-center">
                {today && !selected && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                    Today
                  </Badge>
                )}
                {off && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                    Closed
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-primary/10 border-2 border-primary/50" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-destructive" />
          <span>Closed</span>
        </div>
      </div>
    </div>
  );
};
