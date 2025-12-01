import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { MoreHorizontal, CalendarIcon, RefreshCw, Plus, Clock, Coffee, HelpCircle, Layers, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TimePicker } from "../TimePicker";
import type { ScheduleData, TimeSlot, RepeatRule } from "../AddEditScheduleModal";
interface RegularScheduleTabProps {
  scheduleData: ScheduleData;
  onUpdate: (updates: Partial<ScheduleData>) => void;
  onSwitchToDay?: (day: string) => void;
}
const DAYS = [{
  key: "MON",
  label: "Monday",
  short: "Mon"
}, {
  key: "TUE",
  label: "Tuesday",
  short: "Tue"
}, {
  key: "WED",
  label: "Wednesday",
  short: "Wed"
}, {
  key: "THU",
  label: "Thursday",
  short: "Thu"
}, {
  key: "FRI",
  label: "Friday",
  short: "Fri"
}, {
  key: "SAT",
  label: "Saturday",
  short: "Sat"
}, {
  key: "SUN",
  label: "Sunday",
  short: "Sun"
}];
// Store recent times for each day (could be moved to localStorage in the future)
const recentTimes: Record<string, string[]> = {};
export function RegularScheduleTab({
  scheduleData,
  onUpdate,
  onSwitchToDay
}: RegularScheduleTabProps) {
  const [moreOptionsDay, setMoreOptionsDay] = useState<string | null>(null);
  const [addShiftDay, setAddShiftDay] = useState<string | null>(null);
  const [showApplyConfirm, setShowApplyConfirm] = useState<string | null>(null);
  const [lastAppliedSchedule, setLastAppliedSchedule] = useState<ScheduleData | null>(null);
  const [scheduleStartDate, setScheduleStartDate] = useState<Date>(new Date());
  function getDaySchedule(day: string): TimeSlot[] {
    return scheduleData.schedule[day] || [];
  }
  function isDayEnabled(day: string): boolean {
    const daySchedule = getDaySchedule(day);
    return daySchedule.length > 0 && daySchedule.some(slot => slot.type !== "off");
  }
  function toggleDay(day: string, enabled: boolean) {
    const currentSchedule = {
      ...scheduleData.schedule
    };
    if (enabled) {
      currentSchedule[day] = [{
        start: "9a",
        end: "5p",
        type: "normal"
      }];
    } else {
      currentSchedule[day] = [];
    }
    onUpdate({
      schedule: currentSchedule
    });
  }
  // Parse time to minutes for validation
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

  // Calculate total hours for a day
  function calculateDayHours(day: string): number {
    const daySlots = getDaySchedule(day);
    let totalMinutes = 0;
    
    daySlots.forEach(slot => {
      if (slot.start && slot.end && slot.type !== "off") {
        const startMinutes = timeToMinutes(slot.start);
        const endMinutes = timeToMinutes(slot.end);
        
        // Handle overnight shifts
        if (endMinutes >= startMinutes) {
          totalMinutes += endMinutes - startMinutes;
        } else {
          totalMinutes += (1440 - startMinutes) + endMinutes; // 1440 = 24 hours in minutes
        }
      }
    });
    
    return totalMinutes / 60; // Convert to hours
  }

  // Calculate total weekly hours
  function calculateTotalWeeklyHours(): number {
    return DAYS.reduce((total, day) => total + calculateDayHours(day.key), 0);
  }

  function updateTimeSlot(day: string, field: 'start' | 'end', value: string) {
    const currentSchedule = {
      ...scheduleData.schedule
    };
    const daySlots = [...(currentSchedule[day] || [])];
    if (daySlots[0]) {
      const updatedSlot = {
        ...daySlots[0],
        [field]: value
      };
      
      // Validate time range
      if (field === 'end' || (field === 'start' && updatedSlot.end)) {
        const startMinutes = timeToMinutes(field === 'start' ? value : updatedSlot.start);
        const endMinutes = timeToMinutes(field === 'end' ? value : updatedSlot.end);
        
        if (endMinutes <= startMinutes) {
          toast({
            title: "Invalid Time Range",
            description: "End time must be after start time.",
            variant: "destructive"
          });
          return;
        }
      }
      
      daySlots[0] = updatedSlot;
      currentSchedule[day] = daySlots;
      
      // Track recent times
      if (!recentTimes[day]) recentTimes[day] = [];
      if (!recentTimes[day].includes(value)) {
        recentTimes[day] = [value, ...recentTimes[day].slice(0, 4)];
      }
      
      onUpdate({
        schedule: currentSchedule
      });
    }
  }
  function updateRepeatRule(day: string, rule: Partial<RepeatRule>) {
    const currentRules = {
      ...scheduleData.repeatRules
    };
    const currentRule = getRepeatRule(day);
    currentRules[day] = {
      type: "weekly",
      startDate: new Date().toISOString().split('T')[0],
      forever: true,
      ...currentRules[day],
      ...rule
    };
    
    // If changing from "none" to a repeating type, convert extra shifts to normal
    if (currentRule.type === "none" && rule.type && rule.type !== "none") {
      const currentSchedule = { ...scheduleData.schedule };
      const daySlots = currentSchedule[day] || [];
      const updatedSlots = daySlots.map(slot => 
        slot.type === "extra" ? { ...slot, type: "normal" as const } : slot
      );
      currentSchedule[day] = updatedSlots;
      onUpdate({
        repeatRules: currentRules,
        schedule: currentSchedule
      });
    } else {
      onUpdate({
        repeatRules: currentRules
      });
    }
  }
  function getRepeatRule(day: string): RepeatRule {
    return scheduleData.repeatRules[day] || {
      type: "weekly",
      startDate: new Date().toISOString().split('T')[0],
      forever: true
    };
  }
  function copyFromPreviousDay(_day: string) {
    const dayIndex = DAYS.findIndex(d => d.key === _day);
    if (dayIndex <= 0) return;
    const previousDay = DAYS[dayIndex - 1].key;
    const previousSchedule = getDaySchedule(previousDay);
    if (previousSchedule.length > 0) {
      const currentSchedule = {
        ...scheduleData.schedule
      };
      currentSchedule[_day] = [...previousSchedule];
      onUpdate({
        schedule: currentSchedule
      });
    }
  }
  function applyToAllDays(sourceDay: string) {
    const sourceSchedule = getDaySchedule(sourceDay);
    if (sourceSchedule.length === 0) return;
    
    // Store current state for undo
    setLastAppliedSchedule({ ...scheduleData });
    
    const currentSchedule = {
      ...scheduleData.schedule
    };
    const sourceRepeatRule = getRepeatRule(sourceDay);
    const currentRepeatRules = { ...scheduleData.repeatRules };
    
    DAYS.forEach(day => {
      if (day.key !== sourceDay) {
        currentSchedule[day.key] = [...sourceSchedule];
        currentRepeatRules[day.key] = { ...sourceRepeatRule };
      }
    });
    
    onUpdate({
      schedule: currentSchedule,
      repeatRules: currentRepeatRules
    });
    
    setShowApplyConfirm(null);
    setMoreOptionsDay(null);
    
    // Show success toast with undo option
    toast({
      title: "Schedule Applied to All Days",
      description: "All days now use the same schedule settings.",
      action: <Button variant="outline" size="sm" onClick={handleUndoApplyAll}>
          Undo
        </Button>
    });
    
    // Auto-hide undo option after 8 seconds
    setTimeout(() => {
      setLastAppliedSchedule(null);
    }, 8000);
  }

  function handleUndoApplyAll() {
    if (lastAppliedSchedule) {
      onUpdate(lastAppliedSchedule);
      setLastAppliedSchedule(null);
      toast({
        title: "Changes Undone",
        description: "Schedule has been reverted to previous state."
      });
    }
  }

  function addShift(day: string) {
    const currentSchedule = {
      ...scheduleData.schedule
    };
    const daySlots = [...(currentSchedule[day] || [])];
    daySlots.push({
      start: "6p",
      end: "9p",
      type: "extra"
    });
    currentSchedule[day] = daySlots;
    onUpdate({
      schedule: currentSchedule
    });
    setAddShiftDay(null);
  }

  function addBreak(day: string) {
    const currentSchedule = {
      ...scheduleData.schedule
    };
    const daySlots = [...(currentSchedule[day] || [])];
    daySlots.push({
      start: "12p",
      end: "1p",
      type: "off",
      reason: "Break"
    });
    currentSchedule[day] = daySlots;
    onUpdate({
      schedule: currentSchedule
    });
    setAddShiftDay(null);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(scheduleStartDate);
  startDate.setHours(0, 0, 0, 0);
  const isFutureStart = startDate > today;

  function removeTimeSlot(day: string, index: number) {
    const currentSchedule = {
      ...scheduleData.schedule
    };
    const daySlots = [...(currentSchedule[day] || [])];
    daySlots.splice(index, 1);
    currentSchedule[day] = daySlots;
    onUpdate({
      schedule: currentSchedule
    });
  }

  function updateExtraTimeSlot(day: string, slotIndex: number, field: 'start' | 'end' | 'reason', value: string) {
    const currentSchedule = {
      ...scheduleData.schedule
    };
    const daySlots = [...(currentSchedule[day] || [])];
    if (daySlots[slotIndex]) {
      const updatedSlot = {
        ...daySlots[slotIndex],
        [field]: value
      };
      
      // Validate time range for time fields
      if ((field === 'start' || field === 'end') && updatedSlot.start && updatedSlot.end) {
        const startMinutes = timeToMinutes(updatedSlot.start);
        const endMinutes = timeToMinutes(updatedSlot.end);
        
        if (endMinutes <= startMinutes) {
          toast({
            title: "Invalid Time Range", 
            description: "End time must be after start time.",
            variant: "destructive"
          });
          return;
        }
      }
      
      daySlots[slotIndex] = updatedSlot;
      currentSchedule[day] = daySlots;
      
      // Track recent times for time fields
      if ((field === 'start' || field === 'end')) {
        if (!recentTimes[day]) recentTimes[day] = [];
        if (!recentTimes[day].includes(value)) {
          recentTimes[day] = [value, ...recentTimes[day].slice(0, 4)];
        }
      }
      
      onUpdate({
        schedule: currentSchedule
      });
    }
  }
  return <TooltipProvider>
    <div className="space-y-4 sm:space-y-6">
      {/* Schedule Start Date */}
      <div className="p-3 sm:p-4 bg-muted/20 rounded-lg border-2 border-primary/20">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <label className="text-sm sm:text-base font-semibold text-foreground block mb-1">Schedule Start Date</label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Choose when this schedule becomes active
              </p>
            </div>
            <div className="flex-shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="justify-start h-9 sm:h-10 font-normal bg-background border-2 w-full sm:min-w-[200px] text-sm"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2 sm:mr-3 text-primary flex-shrink-0" />
                    <span className="font-medium truncate">
                      Set Future Start Date
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar 
                    mode="single" 
                    selected={scheduleStartDate} 
                    onSelect={(date) => date && setScheduleStartDate(date)}
                    disabled={(date) => date < new Date()}
                    initialFocus 
                    className="p-3 pointer-events-auto" 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Future Start Date Message */}
          {isFutureStart && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                This schedule will begin on <span className="font-medium">{format(scheduleStartDate, "MMMM d, yyyy")}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold">Weekly Schedule</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Set regular working hours for each day of the week
          </p>
          <div className="flex items-center gap-2 mt-2 p-2 bg-muted/30 rounded-md">
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              This schedule repeats every week by default.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          
        </div>
      </div>

      {/* Days List - Mobile Optimized */}
      <div className="space-y-2">
        {DAYS.map((day) => {
         const daySchedule = getDaySchedule(day.key);
         const enabled = isDayEnabled(day.key);
         const repeatRule = getRepeatRule(day.key);
         const mainSlot = daySchedule[0];
         const extraSlots = daySchedule.slice(1);
         const totalHours = calculateDayHours(day.key);
         return <div key={day.key} className="space-y-2">
               {/* Main Day Row - Mobile Stack */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border border-border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                 {/* Day Toggle */}
                 <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:items-start gap-1 min-w-0 sm:min-w-[120px]">
                   <div className="flex items-center gap-3">
                     <Switch checked={enabled} onCheckedChange={checked => toggleDay(day.key, checked)} />
                     <span className="font-medium text-sm sm:text-base">{day.short} <span className="hidden sm:inline">{day.label.slice(3)}</span></span>
                   </div>
                   {enabled && totalHours > 0 && (
                     <div className="sm:ml-8 text-xs text-muted-foreground font-medium">
                       {totalHours.toFixed(1)}h
                     </div>
                   )}
                 </div>

                {/* Time Pickers - Mobile Stack */}
                {enabled ? <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <TimePicker
                        value={mainSlot?.start || "9a"}
                        onChange={value => updateTimeSlot(day.key, 'start', value)}
                        placeholder="Start"
                        recentTimes={recentTimes[day.key] || []}
                      />
                      
                      <span className="text-muted-foreground text-sm flex-shrink-0">to</span>
                      
                      <TimePicker
                        value={mainSlot?.end || "5p"}
                        onChange={value => updateTimeSlot(day.key, 'end', value)}
                        placeholder="End"
                        recentTimes={recentTimes[day.key] || []}
                      />
                    </div>

                    {/* Add Shift/Break Button */}
                    <div className="flex items-center gap-2">
                      <Popover open={addShiftDay === day.key} onOpenChange={open => setAddShiftDay(open ? day.key : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 sm:w-48 max-h-[50vh] overflow-hidden" align="start">
                          <div className="space-y-2 p-2 overflow-y-auto max-h-[45vh]">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => addBreak(day.key)}
                              className="w-full justify-start text-xs sm:text-sm"
                            >
                              <Coffee className="w-4 h-4 mr-2" />
                              Add Break
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      {/* More Options */}
                      {enabled && <Popover open={moreOptionsDay === day.key} onOpenChange={open => setMoreOptionsDay(open ? day.key : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 sm:w-80 p-0 max-h-[70vh] overflow-hidden" align="end">
                          <TooltipProvider>
                            <div className="p-4 space-y-4 overflow-y-auto max-h-[65vh]">
                              <div className="pb-2 border-b">
                                <h4 className="font-semibold text-sm sm:text-base">{day.label} Settings</h4>
                                <p className="text-xs text-muted-foreground mt-1">Configure schedule options for this day</p>
                              </div>
                              
                              {/* Repeat Schedule */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs sm:text-sm font-medium text-foreground">Repeat Schedule</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs">How often this schedule repeats</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                 <Select value={repeatRule.type} onValueChange={(value: "weekly" | "biweekly" | "monthly" | "none") => updateRepeatRule(day.key, {
                          type: value
                        })}>
                                   <SelectTrigger className="h-9 bg-background">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="weekly">Every week (default)</SelectItem>
                                     <SelectItem value="biweekly">Every other week</SelectItem>
                                     <SelectItem value="monthly">Every month</SelectItem>
                                     <SelectItem value="none">No repeat</SelectItem>
                                  </SelectContent>
                                 </Select>
                              </div>

                              {/* Extra Shift Option - Only show when no repeat is selected */}
                              {repeatRule.type === "none" && (
                                <div className="space-y-2 p-3 bg-muted/20 rounded-md border">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm font-medium">Extra Shift Option</span>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p className="text-xs">Add extra shifts for one-time scheduling needs</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      addShift(day.key);
                                      setMoreOptionsDay(null);
                                    }}
                                    className="w-full h-9 justify-start text-xs sm:text-sm"
                                  >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Add Extra Shift
                                  </Button>
                                </div>
                              )}

                              {/* End Date */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs sm:text-sm font-medium text-foreground">End Date</label>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs">When this schedule should stop repeating</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full justify-start h-9 font-normal bg-background text-xs sm:text-sm">
                                      <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                                      <span className={repeatRule.endDate ? "text-foreground" : "text-muted-foreground"}>
                                        {repeatRule.endDate ? format(new Date(repeatRule.endDate), "MMM d, yyyy") : "No end date"}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={repeatRule.endDate ? new Date(repeatRule.endDate) : undefined} onSelect={date => updateRepeatRule(day.key, {
                              endDate: date?.toISOString().split('T')[0],
                              forever: !date
                            })} initialFocus className="p-3 pointer-events-auto" />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {/* Apply to All Days */}
                              <div className="pt-3 border-t space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-xs sm:text-sm font-medium text-foreground">Apply to All Days</span>
                                    <p className="text-xs text-muted-foreground">Copy this day's settings to all other days</p>
                                  </div>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p className="text-xs">This will overwrite existing schedules on other days</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  onClick={() => setShowApplyConfirm(day.key)}
                                  className="w-full h-9 font-medium text-xs sm:text-sm"
                                >
                                  <Layers className="w-4 h-4 mr-2" />
                                  Apply to All Days
                                </Button>
                              </div>

                              {/* Reserved space for future options */}
                              <div className="pt-3 border-t border-dashed border-muted space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Advanced Options</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    console.log('Go to Day Schedule clicked for day:', day.key);
                                    onSwitchToDay?.(day.key);
                                    setMoreOptionsDay(null);
                                  }}
                                  className="w-full h-8 text-xs justify-start font-normal"
                                >
                                  <CalendarIcon className="w-3 h-3 mr-2" />
                                  Go to Day Schedule
                                </Button>
                              </div>
                            </div>
                          </TooltipProvider>
                        </PopoverContent>
                      </Popover>}
                    </div>
                  </div> : <div className="flex-1 text-muted-foreground text-xs sm:text-sm">
                    Off day
                  </div>}
               </div>

               {/* Extra Shifts and Breaks - Mobile Stack */}
               {extraSlots.length > 0 && <div className="ml-0 sm:ml-[140px] space-y-2 border-t border-border/30 pt-2">
                   {extraSlots.map((slot, slotIndex) => <div key={slotIndex + 1} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 border border-border/50 rounded-md bg-muted/10">
                       <div className="flex items-center gap-2 min-w-0 sm:min-w-[80px]">
                         {slot.type === "extra" ? <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" /> : <Coffee className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                         <span className="text-xs sm:text-sm font-medium">
                           {slot.type === "extra" ? "Shift" : "Break"}
                         </span>
                       </div>

                       <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                         <div className="flex items-center gap-2 flex-1">
                           <TimePicker
                             value={slot.start}
                             onChange={value => updateExtraTimeSlot(day.key, slotIndex + 1, 'start', value)}
                             className="w-20"
                             recentTimes={recentTimes[day.key] || []}
                           />
                           
                           <span className="text-xs text-muted-foreground flex-shrink-0">to</span>
                           
                           <TimePicker
                             value={slot.end}
                             onChange={value => updateExtraTimeSlot(day.key, slotIndex + 1, 'end', value)}
                             className="w-20"
                             recentTimes={recentTimes[day.key] || []}
                           />
                         </div>

                         {/* Note field for breaks */}
                         {slot.type === "off" && <Input 
                           placeholder="Break note..."
                           value={slot.reason || ""}
                           onChange={(e) => updateExtraTimeSlot(day.key, slotIndex + 1, 'reason', e.target.value)}
                           className="h-8 text-xs flex-1 sm:max-w-[120px]"
                         />}

                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => removeTimeSlot(day.key, slotIndex + 1)}
                           className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive self-start sm:self-center"
                         >
                           ×
                         </Button>
                       </div>
                     </div>)}
                 </div>}
             </div>;
       })}
       </div>

      {/* Summary */}
      <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-xs sm:text-sm font-medium">
                {DAYS.filter(day => isDayEnabled(day.key)).length} of 7 days scheduled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {calculateTotalWeeklyHours().toFixed(1)}h weekly
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Apply to All Confirmation Dialog */}
      <AlertDialog open={showApplyConfirm !== null} onOpenChange={() => setShowApplyConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Schedule to All Days?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply this day's schedule to all days? This will overwrite other days' existing schedules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => showApplyConfirm && applyToAllDays(showApplyConfirm)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </TooltipProvider>
}