import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DateTimePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  onDateSelect,
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Select Date</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onDateSelect(date);
              setIsOpen(false);
            }}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};


