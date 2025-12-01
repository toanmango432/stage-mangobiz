import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, addWeeks, isSameDay, startOfWeek, addDays } from "date-fns";

interface FutureTimeOffRequest {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  isRecurring?: boolean;
  endDate?: string;
}

interface FutureTimeOffChipProps {
  employeeId: string;
  weekdayIndex: number; // 0 = Monday, 6 = Sunday
  weekdayName: string; // "MON", "TUE", etc.
  futureRequests: FutureTimeOffRequest[];
  onChipClick?: (employeeId: string, date: string) => void;
}

export function FutureTimeOffChip({ 
  employeeId, 
  weekdayIndex, 
  weekdayName, 
  futureRequests,
  onChipClick 
}: FutureTimeOffChipProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Get current week start (Monday)
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  
  // Find next time off occurrences for this weekday within 8 weeks
  const getNextTimeOffDates = () => {
    const nextDates: { date: Date; reason: string }[] = [];
    
    // Check next 8 weeks for this specific weekday
    for (let weekOffset = 1; weekOffset <= 8; weekOffset++) {
      const targetWeek = addWeeks(currentWeekStart, weekOffset);
      const targetDate = addDays(targetWeek, weekdayIndex);
      
      // Check if employee has time off on this date
      const matchingRequest = futureRequests.find(req => 
        req.employeeId === employeeId && 
        isSameDay(new Date(req.date), targetDate)
      );
      
      if (matchingRequest) {
        nextDates.push({
          date: targetDate,
          reason: matchingRequest.reason
        });
      }
    }
    
    return nextDates.slice(0, 3); // Return max 3 dates
  };

  const nextOffDates = getNextTimeOffDates();
  
  if (nextOffDates.length === 0) {
    return null;
  }

  const nextOffDate = nextOffDates[0];
  const isNextWeek = format(nextOffDate.date, 'w') === format(addWeeks(new Date(), 1), 'w');
  
  // Format the preview text
  const getPreviewText = () => {
    if (isNextWeek) {
      return `Off next ${weekdayName.slice(0, 3)}`;
    } else {
      return `Off ${weekdayName.slice(0, 3)}, ${format(nextOffDate.date, 'MMM d')}`;
    }
  };

  const handleClick = () => {
    onChipClick?.(employeeId, format(nextOffDate.date, 'yyyy-MM-dd'));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    } else if (e.key === 'Escape') {
      setTooltipOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <Badge
            variant="chip"
            className="mt-1"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`Next time off for ${weekdayName}: ${getPreviewText()}`}
          >
            {getPreviewText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="apple-shadow-md max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-xs">Upcoming {weekdayName} time off:</p>
            {nextOffDates.map((offDate, index) => (
              <div key={index} className="text-xs text-muted-foreground">
                <span className="font-medium">{format(offDate.date, 'MMM d, yyyy')}</span>
                <span className="ml-2">({offDate.reason})</span>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground mt-2 border-t border-border pt-1">
              Click to view details
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}