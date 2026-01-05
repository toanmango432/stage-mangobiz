import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Generate 15-minute increment times
function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let hour = 5; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const period = hour < 12 ? 'a' : 'p';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const timeStr = minute === 0 
        ? `${displayHour}${period}`
        : `${displayHour}:${minute.toString().padStart(2, '0')}${period}`;
      times.push(timeStr);
    }
  }
  // Add midnight
  times.push("12a");
  return times;
}

const TIME_OPTIONS = generateTimeOptions();

// Common/popular times for quick access
const POPULAR_TIMES = ["7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p"];

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  recentTimes?: string[];
  disabled?: boolean;
  minTime?: string;
}

export function TimePicker({ 
  value, 
  onChange, 
  placeholder = "Select time", 
  className,
  recentTimes = [],
  disabled = false,
  minTime
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse time string to minutes for calculations
  function timeToMinutes(timeStr: string): number {
    const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?(a|p)$/);
    if (!match) return 0;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2] || "0");
    const period = match[3];
    
    if (period === 'p' && hours !== 12) hours += 12;
    if (period === 'a' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  }

  // Convert minutes back to time string
  function minutesToTime(totalMinutes: number): string {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const period = hours >= 12 ? 'p' : 'a';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    return minutes === 0 ? `${hours}${period}` : `${hours}:${minutes.toString().padStart(2, '0')}${period}`;
  }

  // Adjust time by increment (for keyboard shortcuts)
  function adjustTime(increment: number) {
    const currentMinutes = timeToMinutes(value || "9a");
    const newMinutes = Math.max(0, Math.min(24 * 60 - 15, currentMinutes + increment));
    const newTime = minutesToTime(newMinutes);
    onChange(newTime);
  }

  // Handle keyboard shortcuts
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isTyping) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustTime(15);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustTime(-15);
      }
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === 'Escape') {
      setIsTyping(false);
      setInputValue("");
      inputRef.current?.blur();
    }
  }

  // Handle mouse wheel
  function handleWheel(e: WheelEvent) {
    if (!open) return;
    e.preventDefault();
    const increment = e.deltaY > 0 ? -15 : 15;
    adjustTime(increment);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (container && open) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [open, value]);

  // Validate and parse input
  function parseTimeInput(input: string): string | null {
    const cleaned = input.toLowerCase().trim();
    
    // Try to match various formats
    const patterns = [
      /^(\d{1,2})(a|p)$/,                    // 9a, 10p
      /^(\d{1,2}):(\d{2})(a|p)$/,           // 9:30a, 10:15p
      /^(\d{1,2})\.(\d{2})(a|p)$/,          // 9.30a, 10.15p
      /^(\d{1,2}):(\d{2})$/,                // 24-hour format
      /^(\d{1,2})$/                         // Just number
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2] || "0");
        let period = match[3];

        // Handle 24-hour format
        if (!period) {
          if (hours >= 0 && hours <= 11) {
            period = hours < 7 ? 'p' : 'a'; // Assume evening for early hours
          } else if (hours <= 23) {
            period = 'p';
            if (hours > 12) hours -= 12;
          } else {
            return null;
          }
        }

        // Validate
        if (hours < 1 || hours > 12 || minutes < 0 || minutes >= 60) {
          return null;
        }

        // Round to nearest 15 minutes
        const roundedMinutes = Math.round(minutes / 15) * 15;
        
        return roundedMinutes === 0 ? `${hours}${period}` : `${hours}:${roundedMinutes.toString().padStart(2, '0')}${period}`;
      }
    }

    return null;
  }

  function handleInputSubmit() {
    if (inputValue.trim()) {
      const parsed = parseTimeInput(inputValue);
      if (parsed && TIME_OPTIONS.includes(parsed)) {
        onChange(parsed);
        setOpen(false);
      }
    }
    setIsTyping(false);
    setInputValue("");
  }

  // Filter times for search and minimum time
  const availableTimes = minTime 
    ? TIME_OPTIONS.filter(time => timeToMinutes(time) > timeToMinutes(minTime))
    : TIME_OPTIONS;
  
  const filteredTimes = inputValue 
    ? availableTimes.filter(time => 
        time.toLowerCase().includes(inputValue.toLowerCase()) ||
        time.replace(':', '').toLowerCase().includes(inputValue.toLowerCase())
      )
    : availableTimes;

  // Organize times for display
  const displayTimes = [];
  
  // Add recent times if any
  if (recentTimes.length > 0 && !inputValue) {
    const filteredRecentTimes = recentTimes.filter(t => 
      availableTimes.includes(t)
    ).slice(0, 3);
    if (filteredRecentTimes.length > 0) {
      displayTimes.push({ label: "Recent", times: filteredRecentTimes });
    }
  }
  
  // Add popular times if no search
  if (!inputValue) {
    const filteredPopularTimes = POPULAR_TIMES.filter(t => 
      availableTimes.includes(t)
    );
    if (filteredPopularTimes.length > 0) {
      displayTimes.push({ label: "Popular", times: filteredPopularTimes });
    }
  }
  
  // Add all times
  displayTimes.push({ label: inputValue ? "Matching" : "All Times", times: filteredTimes });

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-24 justify-between font-normal bg-background",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0" align="start">
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              placeholder="Type time (e.g., 9:30a)"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsTyping(true);
              }}
              onKeyDown={handleKeyDown}
              onBlur={handleInputSubmit}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          
          <ScrollArea className="h-48">
            <div className="p-1">
              {displayTimes.map((section, sectionIndex) => (
                section.times.length > 0 && (
                  <div key={sectionIndex} className="mb-2">
                    {section.label !== "All Times" && (
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mb-1">
                        {section.label}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-1">
                      {section.times.slice(0, section.label === "All Times" ? undefined : 6).map((time) => (
                        <Button
                          key={time}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 text-xs font-mono justify-center",
                            value === time && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => {
                            onChange(time);
                            setOpen(false);
                            setIsTyping(false);
                            setInputValue("");
                          }}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              ))}
              
              {filteredTimes.length === 0 && inputValue && (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No matching times found
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}