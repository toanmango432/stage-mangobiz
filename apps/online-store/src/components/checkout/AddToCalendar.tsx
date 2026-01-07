import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarEvent, downloadICS, getGoogleCalendarUrl, getOutlookCalendarUrl } from "@/lib/utils/calendar";
import { toast } from "sonner";

interface AddToCalendarProps {
  event: CalendarEvent;
}

export const AddToCalendar = ({ event }: AddToCalendarProps) => {
  const handleDownloadICS = () => {
    try {
      downloadICS(event, `${event.title.replace(/\s+/g, '_')}.ics`);
      toast.success("Calendar event downloaded!");
    } catch (error) {
      toast.error("Failed to download calendar event");
    }
  };

  const handleGoogleCalendar = () => {
    window.open(getGoogleCalendarUrl(event), '_blank');
  };

  const handleOutlookCalendar = () => {
    window.open(getOutlookCalendarUrl(event), '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Calendar className="h-4 w-4 mr-2" />
          Add to Calendar
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookCalendar}>
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS}>
          Apple Calendar / iCal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
