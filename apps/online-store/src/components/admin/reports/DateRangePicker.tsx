'use client';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  onRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ onRangeChange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onRangeChange(range);
  };

  const presets = [
    {
      label: "Today",
      range: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: "Last 7 days",
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
      },
    },
    {
      label: "Last 30 days",
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      },
    },
    {
      label: "This month",
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
  ];

  return (
    <div className="flex gap-2">
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handleSelect(preset.range)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
