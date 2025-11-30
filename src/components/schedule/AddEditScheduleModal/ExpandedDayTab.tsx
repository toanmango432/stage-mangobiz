import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Clock, Plus, Trash2, CalendarIcon, Save, RotateCcw, FileText, HelpCircle, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { TimePicker } from "../TimePicker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ScheduleData, TimeSlot, RepeatRule } from "../AddEditScheduleModal";

interface ExpandedDayTabProps {
  scheduleData: ScheduleData;
  selectedDay: string;
  onDayChange: (day: string) => void;
  onUpdate: (updates: Partial<ScheduleData>) => void;
}

const DAYS = [
  { key: "MON", label: "Monday" },
  { key: "TUE", label: "Tuesday" },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday" },
  { key: "FRI", label: "Friday" },
  { key: "SAT", label: "Saturday" },
  { key: "SUN", label: "Sunday" }
];

const recentTimes: Record<string, string[]> = {};

export function ExpandedDayTab({
  scheduleData,
  selectedDay,
  onDayChange,
  onUpdate
}: ExpandedDayTabProps) {
  const [tempScheduleData, setTempScheduleData] = useState<ScheduleData>(scheduleData);
  const [hasChanges, setHasChanges] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [lastAppliedSchedule, setLastAppliedSchedule] = useState<ScheduleData | null>(null);
  
  const daySchedule = tempScheduleData.schedule[selectedDay] || [];
  const dayNotes = tempScheduleData.notes?.[selectedDay] || "";
  const repeatRule = tempScheduleData.repeatRules?.[selectedDay] || {
    type: "weekly" as const,
    startDate: new Date().toISOString().split('T')[0],
    forever: true
  };

  // Helper functions
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

  function calculateShiftHours(slot: TimeSlot): number {
    if (!slot.start || !slot.end) return 0;
    const startMinutes = timeToMinutes(slot.start);
    const endMinutes = timeToMinutes(slot.end);
    return endMinutes >= startMinutes ? (endMinutes - startMinutes) / 60 : (1440 - startMinutes + endMinutes) / 60;
  }

  function getNextTimeSlot(currentTime: string, hoursToAdd: number = 1): string {
    const minutes = timeToMinutes(currentTime) + hoursToAdd * 60;
    const hour24 = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    let hour12 = hour24;
    let suffix = 'a';
    if (hour24 >= 12) {
      suffix = 'p';
      if (hour24 > 12) hour12 = hour24 - 12;
    }
    if (hour24 === 0) hour12 = 12;
    return minute === 0 ? `${hour12}${suffix}` : `${hour12}:${minute.toString().padStart(2, '0')}${suffix}`;
  }

  function updateTempData(updates: Partial<ScheduleData>) {
    setTempScheduleData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }

  // Schedule management functions
  function addTimeSlot() {
    const currentSchedule = { ...tempScheduleData.schedule };
    const daySlots = [...(currentSchedule[selectedDay] || [])];
    const lastSlot = daySlots[daySlots.length - 1];
    const defaultStart = lastSlot ? getNextTimeSlot(lastSlot.end) : "9a";
    const defaultEnd = getNextTimeSlot(defaultStart, 8);

    daySlots.push({ start: defaultStart, end: defaultEnd, type: "normal" });
    currentSchedule[selectedDay] = daySlots;
    updateTempData({ schedule: currentSchedule });
  }

  function addBreak() {
    const currentSchedule = { ...tempScheduleData.schedule };
    const daySlots = [...(currentSchedule[selectedDay] || [])];
    let defaultStart = "12p";
    let defaultEnd = "1p";

    const workingSlots = daySlots.filter(slot => slot.type !== "off");
    if (workingSlots.length > 0) {
      const firstShift = workingSlots[0];
      const lastShift = workingSlots[workingSlots.length - 1];
      if (firstShift && lastShift) {
        const startMinutes = timeToMinutes(firstShift.start);
        const endMinutes = timeToMinutes(lastShift.end);
        const midpointMinutes = startMinutes + (endMinutes - startMinutes) / 2;
        const midHour24 = Math.floor(midpointMinutes / 60) % 24;
        let midHour12 = midHour24;
        let suffix = 'a';
        if (midHour24 >= 12) {
          suffix = 'p';
          if (midHour24 > 12) midHour12 = midHour24 - 12;
        }
        if (midHour24 === 0) midHour12 = 12;
        defaultStart = `${midHour12}${suffix}`;
        defaultEnd = getNextTimeSlot(defaultStart, 1);
      }
    }

    daySlots.push({ start: defaultStart, end: defaultEnd, type: "off", reason: "Lunch Break" });
    currentSchedule[selectedDay] = daySlots;
    updateTempData({ schedule: currentSchedule });
  }

  function updateTimeSlot(slotIndex: number, field: 'start' | 'end', value: string) {
    const currentSchedule = { ...tempScheduleData.schedule };
    const daySlots = [...(currentSchedule[selectedDay] || [])];
    if (daySlots[slotIndex]) {
      const updatedSlot = { ...daySlots[slotIndex], [field]: value };

      if (updatedSlot.start && updatedSlot.end) {
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
      currentSchedule[selectedDay] = daySlots;
      updateTempData({ schedule: currentSchedule });
    }
  }

  function updateShiftType(slotIndex: number, isExtra: boolean) {
    const currentSchedule = { ...tempScheduleData.schedule };
    const daySlots = [...(currentSchedule[selectedDay] || [])];
    if (daySlots[slotIndex]) {
      daySlots[slotIndex] = { ...daySlots[slotIndex], type: isExtra ? "extra" : "normal" };
      currentSchedule[selectedDay] = daySlots;
      updateTempData({ schedule: currentSchedule });
    }
  }

  function updateBreakReason(slotIndex: number, reason: string) {
    const currentSchedule = { ...tempScheduleData.schedule };
    const daySlots = [...(currentSchedule[selectedDay] || [])];
    if (daySlots[slotIndex]) {
      daySlots[slotIndex] = { ...daySlots[slotIndex], reason };
      currentSchedule[selectedDay] = daySlots;
      updateTempData({ schedule: currentSchedule });
    }
  }

  function removeTimeSlot(slotIndex: number) {
    const currentSchedule = { ...tempScheduleData.schedule };
    const daySlots = [...(currentSchedule[selectedDay] || [])];
    daySlots.splice(slotIndex, 1);
    currentSchedule[selectedDay] = daySlots;
    updateTempData({ schedule: currentSchedule });
  }

  function updateNotes(notes: string) {
    const currentNotes = { ...tempScheduleData.notes };
    currentNotes[selectedDay] = notes;
    updateTempData({ notes: currentNotes });
  }

  function updateRepeatRule(updates: Partial<RepeatRule>) {
    const currentRules = { ...tempScheduleData.repeatRules };
    currentRules[selectedDay] = { ...repeatRule, ...updates };
    
    // If changing from "none" to a repeating type, convert extra shifts to normal
    if (repeatRule.type === "none" && updates.type && updates.type !== "none") {
      const currentSchedule = { ...tempScheduleData.schedule };
      const daySlots = currentSchedule[selectedDay] || [];
      const updatedSlots = daySlots.map(slot => 
        slot.type === "extra" ? { ...slot, type: "normal" as const } : slot
      );
      currentSchedule[selectedDay] = updatedSlots;
      updateTempData({ repeatRules: currentRules, schedule: currentSchedule });
    } else {
      updateTempData({ repeatRules: currentRules });
    }
  }

  function saveChanges() {
    onUpdate(tempScheduleData);
    setHasChanges(false);
    toast({
      title: "Changes Saved",
      description: `Schedule updated for ${DAYS.find(d => d.key === selectedDay)?.label}.`
    });
  }

  function discardChanges() {
    setTempScheduleData(scheduleData);
    setHasChanges(false);  
    toast({
      title: "Changes Discarded",
      description: "Reverted to previous state."
    });
  }

  function applyToAllDays() {
    const currentDaySchedule = tempScheduleData.schedule[selectedDay] || [];
    const currentDayNotes = tempScheduleData.notes?.[selectedDay] || "";
    const currentRepeatRule = tempScheduleData.repeatRules?.[selectedDay] || {
      type: "weekly" as const,
      startDate: new Date().toISOString().split('T')[0],
      forever: true
    };

    if (currentDaySchedule.length === 0) {
      toast({
        title: "No Schedule to Apply",
        description: "Please add shifts before applying to all days.",
        variant: "destructive"
      });
      return;
    }

    setLastAppliedSchedule({ ...tempScheduleData });
    const newSchedule = { ...tempScheduleData.schedule };
    const newNotes = { ...tempScheduleData.notes };
    const newRepeatRules = { ...tempScheduleData.repeatRules };

    DAYS.forEach(day => {
      if (day.key !== selectedDay) {
        newSchedule[day.key] = [...currentDaySchedule];
        newNotes[day.key] = currentDayNotes;
        newRepeatRules[day.key] = { ...currentRepeatRule };
      }
    });

    const updatedData = {
      ...tempScheduleData,
      schedule: newSchedule,
      notes: newNotes,
      repeatRules: newRepeatRules
    };
    
    setTempScheduleData(updatedData);
    setHasChanges(true);
    setShowApplyConfirm(false);

    toast({
      title: "Schedule Applied to All Days",
      description: "All days now use the same schedule settings.",
      action: <Button variant="outline" size="sm" onClick={handleUndoApplyAll}>Undo</Button>
    });

    setTimeout(() => setLastAppliedSchedule(null), 8000);
  }

  function handleUndoApplyAll() {
    if (lastAppliedSchedule) {
      setTempScheduleData(lastAppliedSchedule);
      setLastAppliedSchedule(null);
      toast({
        title: "Changes Undone",
        description: "Schedule has been reverted to previous state."
      });
    }
  }

  const totalHours = daySchedule.reduce((sum, slot) => sum + calculateShiftHours(slot), 0);
  const selectedDayInfo = DAYS.find(day => day.key === selectedDay)!;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <div className="flex h-full">
          {/* Left Sidebar - Day Selection & Summary */}
          <div className="w-80 border-r bg-muted/30 p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Day</label>
              <Select value={selectedDay} onValueChange={onDayChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day.key} value={day.key}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{selectedDayInfo.label}</h3>
                <Badge variant="secondary">
                  {totalHours.toFixed(1)}h
                </Badge>
              </div>
              
              {daySchedule.length > 0 ? (
                <div className="space-y-2">
                  {daySchedule.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="font-mono">{slot.start} - {slot.end}</span>
                      <span className="text-muted-foreground">
                        {slot.type === "off" ? "Break" : `${calculateShiftHours(slot).toFixed(1)}h`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No shifts scheduled</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Schedule for {selectedDayInfo.label}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addBreak}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Break
                  </Button>
                  <Button size="sm" onClick={addTimeSlot}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Shift
                  </Button>
                </div>
              </div>

              {/* Schedule Items */}
              {daySchedule.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">No shifts scheduled for {selectedDayInfo.label}</p>
                  <Button variant="outline" onClick={addTimeSlot}>
                    Add First Shift
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {daySchedule.map((slot, index) => (
                    <div
                      key={index}
                      className={cn(
                        "border rounded-lg p-4 space-y-3",
                        slot.type === "off" ? "bg-orange-50/50 border-orange-200" : "bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {slot.type === "off" ? (
                            <div className="flex items-center gap-2">
                              <Coffee className="w-4 h-4 text-orange-600" />
                              <span className="font-medium">Break</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="font-medium">Shift</span>
                              {slot.type === "extra" && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                  Extra
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <TimePicker
                            value={slot.start}
                            onChange={(value) => updateTimeSlot(index, 'start', value)}
                            placeholder="Start time"
                            recentTimes={recentTimes[selectedDay] || []}
                          />
                          <span>-</span>
                          <TimePicker
                            value={slot.end}
                            onChange={(value) => updateTimeSlot(index, 'end', value)}
                            placeholder="End time"
                            recentTimes={recentTimes[selectedDay] || []}
                          />
                        </div>
                      </div>

                      {slot.type === "off" && (
                        <input
                          type="text"
                          placeholder="Break note (optional)"
                          value={slot.reason || ""}
                          onChange={(e) => updateBreakReason(index, e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Repeat Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold">Repeat Settings</h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>These settings apply only to this day's schedule pattern</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={repeatRule.type === "weekly" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => updateRepeatRule({ type: "weekly" })}
                  >
                    Every Week
                  </Button>
                  <Button 
                    variant={repeatRule.type === "biweekly" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => updateRepeatRule({ type: "biweekly" })}
                  >
                    Alternate Weeks
                  </Button>
                  <Button 
                    variant={repeatRule.type === "monthly" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => updateRepeatRule({ type: "monthly" })}
                  >
                    Monthly
                  </Button>
                  <Button 
                    variant={repeatRule.type === "none" ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => updateRepeatRule({ type: "none" })}
                  >
                    No Repeat
                  </Button>
                </div>

                {repeatRule.type !== "none" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={!repeatRule.forever} 
                        onCheckedChange={(checked) => updateRepeatRule({ forever: !checked })} 
                      />
                      <span className="text-sm text-muted-foreground">Set end date</span>
                    </div>
                    
                    {!repeatRule.forever && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-48 justify-start font-normal">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {repeatRule.endDate ? format(new Date(repeatRule.endDate), "MMM d, yyyy") : "Select end date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={repeatRule.endDate ? new Date(repeatRule.endDate) : undefined} 
                            onSelect={(date) => updateRepeatRule({ endDate: date?.toISOString().split('T')[0] })} 
                            initialFocus 
                            className="p-3 pointer-events-auto" 
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
              </div>

              {/* Extra Shift Options - Only show when no repeat is selected */}
              {repeatRule.type === "none" && daySchedule.some(slot => slot.type !== "off") && (
                <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold">Extra Shift Options</h4>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark shifts as "extra" for one-time scheduling needs</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="space-y-3">
                    {daySchedule.map((slot, index) => 
                      slot.type !== "off" && (
                        <div key={index} className="flex items-center justify-between p-3 bg-card rounded-md border">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Shift {index + 1}: {slot.start} - {slot.end}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Extra shift</span>
                            <Switch
                              checked={slot.type === "extra"}
                              onCheckedChange={(checked) => updateShiftType(index, checked)}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <h4 className="text-lg font-semibold">Notes</h4>
                </div>
                
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Add notes or special instructions for this day..." 
                    value={dayNotes} 
                    onChange={(e) => updateNotes(e.target.value)} 
                    className="min-h-[80px] resize-none" 
                  />
                  <p className="text-xs text-muted-foreground">
                    Notes will be visible to staff and managers for this day only.
                  </p>
                </div>
              </div>

              {/* Apply to All Days Section */}
              <div className="p-4 bg-muted/20 rounded-lg border border-dashed">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Apply to All Days</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Copy this day's schedule to all other days</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This will overwrite existing schedules on other days</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowApplyConfirm(true)} 
                  className="w-full" 
                  disabled={daySchedule.length === 0}
                >
                  Apply {selectedDayInfo.label}'s Schedule to All Days
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Save/Cancel Footer */}
        {hasChanges && (
          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                You have unsaved changes for {selectedDayInfo.label}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={discardChanges}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Discard
                </Button>
                <Button size="sm" onClick={saveChanges}>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Apply to All Confirmation Dialog */}
      <AlertDialog open={showApplyConfirm} onOpenChange={setShowApplyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Schedule to All Days?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply {selectedDayInfo.label}&apos;s schedule to all days? This will overwrite other days&apos; existing schedules, notes, and repeat settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyToAllDays}>
              Apply to All Days
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}