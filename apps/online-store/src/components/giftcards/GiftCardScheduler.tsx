import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

interface GiftCardSchedulerProps {
  onScheduleChange: (scheduled: boolean, date?: Date) => void;
}

export const GiftCardScheduler = ({ onScheduleChange }: GiftCardSchedulerProps) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleScheduleToggle = (checked: boolean) => {
    setIsScheduled(checked);
    onScheduleChange(checked, selectedDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (isScheduled && date) {
      onScheduleChange(true, date);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="schedule-delivery" className="text-base font-semibold">
              Schedule Delivery
            </Label>
            <p className="text-sm text-muted-foreground">
              Send this gift card on a specific date
            </p>
          </div>
          <Switch
            id="schedule-delivery"
            checked={isScheduled}
            onCheckedChange={handleScheduleToggle}
          />
        </div>

        {isScheduled && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Delivery Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mt-2"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Delivery Time</p>
                <p className="text-muted-foreground">
                  Gift card will be sent at 9:00 AM in recipient's timezone
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
