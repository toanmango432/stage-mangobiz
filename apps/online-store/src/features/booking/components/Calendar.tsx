import React, { useState, useMemo } from 'react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DayOffDate } from '../types/booking.types';
import { TimeUtils } from '../utils/timeUtils';

interface CalendarProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  offDays?: DayOffDate[];
  minDate?: Date;
  maxDate?: Date;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  offDays = [],
  minDate = new Date(),
  maxDate,
}) => {
  const [weekStart, setWeekStart] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Generate 7 days starting from weekStart
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Check if a date is off
  const isOffDay = (date: Date): boolean => {
    const dateStr = TimeUtils.toISODate(date);
    return offDays.some(off => off.date === dateStr);
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
    return isSameDay(date, parseISO(selectedDate));
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
    onDateSelect(TimeUtils.toISODate(date));
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    if (isDisabled(date)) return;
    
    onDateSelect(TimeUtils.toISODate(date));
    setWeekStart(date);
    setCalendarOpen(false);
  };

  return (
    <div className="w-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(weekStart, 'MMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <ShadcnCalendar
              mode="single"
              selected={selectedDate ? parseISO(selectedDate) : undefined}
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
          className="h-8 w-8"
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
                'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                'hover:border-primary hover:bg-primary/5',
                selected && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
                today && !selected && 'border-primary/50 bg-primary/10',
                disabled && 'opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent',
                !selected && !disabled && 'border-border'
              )}
            >
              {/* Day of week */}
              <span className={cn(
                'text-xs font-medium uppercase mb-1',
                selected ? 'text-primary-foreground' : 'text-muted-foreground'
              )}>
                {format(date, 'EEE')}
              </span>

              {/* Date */}
              <span className={cn(
                'text-2xl font-bold',
                selected && 'text-primary-foreground'
              )}>
                {format(date, 'd')}
              </span>

              {/* Status badges */}
              <div className="mt-2 flex flex-col gap-1">
                {today && !selected && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    Today
                  </Badge>
                )}
                {off && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    Closed
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary/10 border-2 border-primary/50" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span>Closed</span>
        </div>
      </div>
    </div>
  );
};
