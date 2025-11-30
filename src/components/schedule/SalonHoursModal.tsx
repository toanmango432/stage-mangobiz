import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { CalendarIcon, Clock, RefreshCw, X, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { TimePicker } from "./TimePicker";

export interface SalonHours {
  [key: string]: {
    start: string;
    end: string;
    closed: boolean;
  };
}

export interface SpecialDay {
  date: string;
  reason: string;
  allStaffOff: boolean;
}

interface SalonHoursModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salonHours: SalonHours;
  specialDays: SpecialDay[];
  onSalonHoursUpdate: (hours: SalonHours) => void;
  onSpecialDayUpdate: (specialDays: SpecialDay[]) => void;
  onMarkAllStaffOff?: (date: string, reason: string) => void;
}

const DAYS = [
  { key: "MON", label: "Monday", short: "Mon" },
  { key: "TUE", label: "Tuesday", short: "Tue" },
  { key: "WED", label: "Wednesday", short: "Wed" },
  { key: "THU", label: "Thursday", short: "Thu" },
  { key: "FRI", label: "Friday", short: "Fri" },
  { key: "SAT", label: "Saturday", short: "Sat" },
  { key: "SUN", label: "Sunday", short: "Sun" }
];

export function SalonHoursModal({
  open,
  onOpenChange,
  salonHours,
  specialDays,
  onSalonHoursUpdate,
  onSpecialDayUpdate,
  onMarkAllStaffOff
}: SalonHoursModalProps) {
  const [localSalonHours, setLocalSalonHours] = useState<SalonHours>(salonHours);
  const [localSpecialDays, setLocalSpecialDays] = useState<SpecialDay[]>(specialDays);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [specialDayReason, setSpecialDayReason] = useState("");
  const [showMarkAllStaffDialog, setShowMarkAllStaffDialog] = useState(false);
  const [pendingSpecialDay, setPendingSpecialDay] = useState<SpecialDay | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddSpecialDay, setShowAddSpecialDay] = useState(false);

  const updateSalonHours = (day: string, field: 'start' | 'end' | 'closed', value: string | boolean) => {
    const updated = {
      ...localSalonHours,
      [day]: {
        ...localSalonHours[day],
        [field]: value
      }
    };
    setLocalSalonHours(updated);
    setHasUnsavedChanges(true);
  };

  const addSpecialDay = () => {
    if (!selectedDate || !specialDayReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a date and provide a reason.",
        variant: "destructive"
      });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const newSpecialDay: SpecialDay = {
      date: dateStr,
      reason: specialDayReason.trim(),
      allStaffOff: false
    };

    setPendingSpecialDay(newSpecialDay);
    setShowMarkAllStaffDialog(true);
  };

  const confirmSpecialDay = (markAllStaff: boolean) => {
    if (!pendingSpecialDay) return;

    const updatedSpecialDay = {
      ...pendingSpecialDay,
      allStaffOff: markAllStaff
    };

    const updated = [...localSpecialDays, updatedSpecialDay];
    setLocalSpecialDays(updated);
    setHasUnsavedChanges(true);

    // Reset form
    setSelectedDate(undefined);
    setSpecialDayReason("");
    setPendingSpecialDay(null);
    setShowMarkAllStaffDialog(false);
    setShowAddSpecialDay(false);

    if (markAllStaff && onMarkAllStaffOff) {
      onMarkAllStaffOff(pendingSpecialDay.date, pendingSpecialDay.reason);
    }

    toast({
      title: "Special Day Added",
      description: `${pendingSpecialDay.reason} on ${format(new Date(pendingSpecialDay.date), "MMMM d, yyyy")}${markAllStaff ? " with all staff marked off" : ""}`,
    });
  };

  const removeSpecialDay = (index: number) => {
    const updated = localSpecialDays.filter((_, i) => i !== index);
    setLocalSpecialDays(updated);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // Save salon hours to localStorage and call parent handlers
    localStorage.setItem('salonHours', JSON.stringify(localSalonHours));
    localStorage.setItem('specialDays', JSON.stringify(localSpecialDays));
    
    onSalonHoursUpdate(localSalonHours);
    onSpecialDayUpdate(localSpecialDays);
    setHasUnsavedChanges(false);
    
    toast({
      title: "Salon Hours Updated",
      description: `Operating hours and ${localSpecialDays.length} special day(s) have been saved successfully.`,
    });
    
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        setLocalSalonHours(salonHours);
        setLocalSpecialDays(specialDays);
        setHasUnsavedChanges(false);
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const getSalonHoursDisplay = () => {
    const openDays = DAYS.filter(day => !localSalonHours[day.key]?.closed);
    if (openDays.length === 7) {
      const firstDay = localSalonHours[openDays[0].key];
      const allSameHours = openDays.every(day => 
        localSalonHours[day.key]?.start === firstDay?.start && 
        localSalonHours[day.key]?.end === firstDay?.end
      );
      if (allSameHours) {
        return `Mon–Sun: ${firstDay?.start}–${firstDay?.end}`;
      }
    }
    return `${openDays.length} days open`;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Salon Hours & Special Days
            </SheetTitle>
            <SheetDescription>
              Manage your salon's operating hours and special closure days
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Operating Hours Section */}
            <div className="space-y-4">
              <div className="p-4 bg-muted/20 rounded-lg border-2 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <span className="font-medium">Weekly Operating Schedule</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Set your salon's regular hours for each day of the week
                </p>
              </div>

              <div className="space-y-3">
                {DAYS.map(day => {
                  const dayHours = localSalonHours[day.key] || { start: "9:30a", end: "7p", closed: false };
                  const isClosed = dayHours.closed;

                  return (
                    <div key={day.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border rounded-lg bg-card">
                      <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[120px]">
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={!isClosed} 
                            onCheckedChange={(checked) => updateSalonHours(day.key, 'closed', !checked)}
                          />
                          <span className="font-medium">{day.short} <span className="hidden sm:inline">{day.label.slice(3)}</span></span>
                        </div>
                      </div>

                      {!isClosed ? (
                        <div className="flex items-center gap-2 flex-1">
                          <TimePicker
                            value={dayHours.start}
                            onChange={(value) => updateSalonHours(day.key, 'start', value)}
                            placeholder="Start"
                          />
                          <span className="text-muted-foreground text-sm">to</span>
                          <TimePicker
                            value={dayHours.end}
                            onChange={(value) => updateSalonHours(day.key, 'end', value)}
                            placeholder="End"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center flex-1">
                          <Badge variant="secondary" className="text-muted-foreground">
                            Closed
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Special Closure Days Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Special Closure Days
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mark specific dates when the salon will be closed
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddSpecialDay(!showAddSpecialDay)}
                  className="gap-2"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Add Special Off Day
                </Button>
              </div>

              {/* Add Special Day Form - Only shown when button is clicked */}
              {showAddSpecialDay && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Reason</label>
                      <input
                        type="text"
                        placeholder="Holiday, Maintenance, etc."
                        value={specialDayReason}
                        onChange={(e) => setSpecialDayReason(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addSpecialDay} size="sm" className="flex-1">
                      Add Day
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setShowAddSpecialDay(false);
                        setSelectedDate(undefined);
                        setSpecialDayReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* List of Special Days */}
              {localSpecialDays.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">Upcoming Closures</h5>
                  <div className="space-y-2">
                    {localSpecialDays.map((specialDay, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{format(new Date(specialDay.date), "MMMM d, yyyy")}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {specialDay.reason}
                            {specialDay.allStaffOff && (
                              <Badge variant="secondary" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                All Staff Off
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecialDay(index)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-2 sm:mb-0">
                  <AlertTriangle className="w-4 h-4" />
                  Unsaved changes
                </div>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!hasUnsavedChanges}>
                  Save Changes
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showMarkAllStaffDialog} onOpenChange={setShowMarkAllStaffDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark All Staff Off?</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to automatically mark all staff members as off on{" "}
              {pendingSpecialDay && format(new Date(pendingSpecialDay.date), "MMMM d, yyyy")} for{" "}
              "{pendingSpecialDay?.reason}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => confirmSpecialDay(false)}>
              Salon Only
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmSpecialDay(true)}>
              Yes, Mark All Staff Off
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}