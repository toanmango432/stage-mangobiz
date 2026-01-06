import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/Button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MultiWeekScheduleWrapper, type PatternType } from "./AddEditScheduleModal/MultiWeekScheduleWrapper";
import { ExpandedDayTab } from "./AddEditScheduleModal/ExpandedDayTab";
import { TimeOffTab } from "./AddEditScheduleModal/TimeOffTab";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Clock, User, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { createStaffScheduleInput, staffScheduleToUISchedule } from '@/utils/scheduleUtils';
import { staffSchedulesDB } from '@/db/scheduleDatabase';
import type { StaffSchedule } from '@/types/schedule/staffSchedule';
import { selectCurrentUser, selectSalonId, selectDeviceId } from '@/store/slices/authSlice';
export interface Staff {
  id: string;
  name: string;
  nickname: string;
  position: string;
  duration: string;
  avatar: string;
  initials: string;
}
export interface TimeSlot {
  start: string;
  end: string;
  type?: "normal" | "extra" | "off";
  reason?: string;
}
export interface DaySchedule {
  [day: string]: TimeSlot[];
}
export interface RepeatRule {
  type: "weekly" | "biweekly" | "monthly" | "none";
  startDate: string;
  endDate?: string;
  forever: boolean;
}
export interface ScheduleData {
  id?: string;
  staffId: string;
  schedule: DaySchedule;
  repeatRules: {
    [day: string]: RepeatRule;
  };
  notes: {
    [day: string]: string;
  };
}
export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  endDate?: string;
  reason: string;
  isPaid: boolean;
  status: "pending" | "approved" | "denied";
  submittedAt: string;
}
interface AddEditScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffList: Staff[];
  initialStaffId?: string;
  initialTab?: "regular" | "expanded" | "timeoff";
  initialDay?: string;
  existingSchedules?: {
    [staffId: string]: DaySchedule;
  };
  existingTimeOff?: TimeOffRequest[];
  onSave: (data: ScheduleData) => void;
  onTimeOffUpdate: (timeOff: TimeOffRequest[]) => void;
}
export function AddEditScheduleModal({
  open,
  onOpenChange,
  staffList,
  initialStaffId,
  initialTab = "regular",
  initialDay = "MON",
  existingSchedules = {},
  existingTimeOff = [],
  onSave,
  onTimeOffUpdate
}: AddEditScheduleModalProps) {
  // Auth selectors for database operations
  const currentUser = useSelector(selectCurrentUser);
  const storeId = useSelector(selectSalonId);
  const deviceId = useSelector(selectDeviceId);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialStaffId || "");
  const [openStaffSelect, setOpenStaffSelect] = useState(false);
  const [activeTab, setActiveTab] = useState<"regular" | "expanded" | "timeoff">(initialTab);
  const [selectedDay, setSelectedDay] = useState<string>(initialDay);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    staffId: "",
    schedule: {},
    repeatRules: {},
    notes: {}
  });
  const [timeOffData, setTimeOffData] = useState<TimeOffRequest[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [_showUndoToast, setShowUndoToast] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<ScheduleData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-week schedule state
  const [patternType, setPatternType] = useState<PatternType>('fixed');
  const [patternWeeks, setPatternWeeks] = useState<number>(1);
  const [weekSchedules, setWeekSchedules] = useState<ScheduleData[]>([{
    staffId: "",
    schedule: {},
    repeatRules: {},
    notes: {}
  }]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [existingDbSchedule, setExistingDbSchedule] = useState<StaffSchedule | null>(null);
  // Note: isLoadingSchedule can be used to show a loading indicator in the future
  const [_isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const selectedStaff = staffList.find(staff => staff.id === selectedStaffId);
  const canSave = selectedStaffId && hasValidSchedule();

  // Utility function to parse time strings including 30-minute intervals
  function parseTime(timeStr: string) {
    const time = timeStr.toLowerCase();
    const isAM = time.includes('a');
    const isPM = time.includes('p');

    // Handle 30-minute intervals
    const hasHalfHour = time.includes(':30');
    const hour = parseInt(time.replace(/[ap:30]/g, ''));
    let totalHours = hour;
    if (isPM && hour !== 12) totalHours = hour + 12;
    if (isAM && hour === 12) totalHours = 0;
    return totalHours + (hasHalfHour ? 0.5 : 0);
  }

  // Initialize data when staff is selected
  useEffect(() => {
    if (!selectedStaffId) return;

    const loadScheduleData = async () => {
      setIsLoadingSchedule(true);
      const staffTimeOff = existingTimeOff.filter(request => request.employeeId === selectedStaffId);
      setTimeOffData(staffTimeOff);

      try {
        // Try to load existing multi-week schedule from IndexedDB
        const dbSchedule = await staffSchedulesDB.getCurrentForStaff(selectedStaffId);

        if (dbSchedule && dbSchedule.weeks.length > 0) {
          // Found existing schedule in IndexedDB - load it
          setExistingDbSchedule(dbSchedule);
          setPatternType(dbSchedule.patternType === 'rotating' ? 'rotating' : 'fixed');
          setPatternWeeks(dbSchedule.patternWeeks);

          // Convert all weeks to UI format
          const uiWeekSchedules: ScheduleData[] = [];
          for (let i = 1; i <= dbSchedule.patternWeeks; i++) {
            const uiSchedule = staffScheduleToUISchedule(dbSchedule, i);
            uiWeekSchedules.push(uiSchedule);
          }

          setWeekSchedules(uiWeekSchedules);
          setScheduleData(uiWeekSchedules[0] || {
            staffId: selectedStaffId,
            schedule: {},
            repeatRules: {},
            notes: {}
          });
          setSelectedWeek(0);
        } else {
          // No schedule in IndexedDB - use legacy existingSchedules prop
          const existingSchedule = existingSchedules[selectedStaffId] || {};
          const initialScheduleData: ScheduleData = {
            staffId: selectedStaffId,
            schedule: existingSchedule,
            repeatRules: {},
            notes: {}
          };
          setScheduleData(initialScheduleData);
          setWeekSchedules([initialScheduleData]);
          setPatternType('fixed');
          setPatternWeeks(1);
          setSelectedWeek(0);
          setExistingDbSchedule(null);
        }
      } catch (error) {
        console.error('Failed to load schedule from IndexedDB:', error);
        // Fallback to legacy existingSchedules prop
        const existingSchedule = existingSchedules[selectedStaffId] || {};
        const initialScheduleData: ScheduleData = {
          staffId: selectedStaffId,
          schedule: existingSchedule,
          repeatRules: {},
          notes: {}
        };
        setScheduleData(initialScheduleData);
        setWeekSchedules([initialScheduleData]);
        setPatternType('fixed');
        setPatternWeeks(1);
        setSelectedWeek(0);
        setExistingDbSchedule(null);
      } finally {
        setIsLoadingSchedule(false);
        setHasUnsavedChanges(false);
      }
    };

    loadScheduleData();
  }, [selectedStaffId, existingSchedules, existingTimeOff]);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedStaffId(initialStaffId || "");
      setActiveTab(initialTab);
      setSelectedDay(initialDay);
      setHasUnsavedChanges(false);
      setShowUndoToast(false);
    }
  }, [open, initialStaffId, initialTab, initialDay]);

  // Set initial values when modal opens with new props
  useEffect(() => {
    if (open) {
      if (initialStaffId) setSelectedStaffId(initialStaffId);
      setActiveTab(initialTab);
      setSelectedDay(initialDay);
    }
  }, [open, initialStaffId, initialTab, initialDay]);
  function hasValidSchedule(): boolean {
    if (!selectedStaffId) return false;
    const daysWithSchedule = Object.entries(scheduleData.schedule).filter(([_, slots]) => slots.length > 0 && slots.some(slot => slot.start && slot.end && slot.type !== "off"));
    return daysWithSchedule.length > 0;
  }
  function hasScheduleConflicts(): {
    day: string;
    reason: string;
  }[] {
    const conflicts: {
      day: string;
      reason: string;
    }[] = [];
    Object.entries(scheduleData.schedule).forEach(([day, slots]) => {
      // Check for time off conflicts
      const dayTimeOff = timeOffData.filter(request => {
        const requestDate = new Date(request.date);
        const dayOfWeek = requestDate.getDay();
        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        return dayNames[dayOfWeek] === day && request.status === "approved";
      });
      if (dayTimeOff.length > 0 && slots.length > 0) {
        slots.forEach(slot => {
          if (slot.type !== "off") {
            conflicts.push({
              day,
              reason: `Scheduled shift conflicts with approved time off (${dayTimeOff[0].reason})`
            });
          }
        });
      }

      // Check for overlapping shifts
      if (slots.length > 1) {
        for (let i = 0; i < slots.length - 1; i++) {
          for (let j = i + 1; j < slots.length; j++) {
            if (slotsOverlap(slots[i], slots[j])) {
              conflicts.push({
                day,
                reason: `Overlapping shifts: ${slots[i].start}-${slots[i].end} and ${slots[j].start}-${slots[j].end}`
              });
            }
          }
        }
      }
    });
    return conflicts;
  }
  function slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (!slot1.start || !slot1.end || !slot2.start || !slot2.end) return false;
    const start1 = parseTime(slot1.start);
    const end1 = parseTime(slot1.end);
    const start2 = parseTime(slot2.start);
    const end2 = parseTime(slot2.end);
    return start1 < end2 && start2 < end1;
  }
  function getWeeklySummary(): {
    totalHours: number;
    daysScheduled: number;
    conflicts: {
      day: string;
      reason: string;
    }[];
  } {
    const conflicts = hasScheduleConflicts();
    let totalHours = 0;
    let daysScheduled = 0;
    Object.entries(scheduleData.schedule).forEach(([_, slots]) => {
      if (slots.length > 0 && slots.some(slot => slot.start && slot.end && slot.type !== "off")) {
        daysScheduled++;
        slots.forEach(slot => {
          if (slot.start && slot.end && slot.type !== "off") {
            const startTime = parseTime(slot.start);
            const endTime = parseTime(slot.end);
            const duration = endTime > startTime ? endTime - startTime : 24 - startTime + endTime;
            totalHours += duration;
          }
        });
      }
    });
    return {
      totalHours,
      daysScheduled,
      conflicts
    };
  }
  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    const summary = getWeeklySummary();

    // Store current data for undo functionality
    setLastSavedData({
      ...scheduleData
    });

    try {
      // Save to IndexedDB for both fixed and rotating patterns
      if (selectedStaff && currentUser?.id && storeId && deviceId) {
        const effectiveFrom = existingDbSchedule?.effectiveFrom || new Date().toISOString().split('T')[0];
        const staffScheduleInput = createStaffScheduleInput(
          selectedStaffId,
          selectedStaff.name,
          weekSchedules,
          effectiveFrom
        );

        if (existingDbSchedule) {
          // Update existing schedule
          await staffSchedulesDB.update(
            existingDbSchedule.id,
            staffScheduleInput,
            currentUser.id,
            deviceId
          );
        } else {
          // Create new schedule
          await staffSchedulesDB.create(
            staffScheduleInput,
            currentUser.id,
            storeId,
            storeId,
            deviceId
          );
        }
      }

      // Also call the legacy onSave for backward compatibility
      onSave(scheduleData);

      // Save time off updates
      onTimeOffUpdate(timeOffData);

      // Show success message with undo option
      toast({
        title: "Settings Saved",
        description: <div className="space-y-2">
            <p>
              Schedule saved for {selectedStaff?.name}: {summary.daysScheduled} days, {summary.totalHours}h total
              {patternType === 'rotating' && patternWeeks > 1 && (
                <span className="block text-xs text-muted-foreground mt-1">
                  {patternWeeks}-week rotating pattern saved
                </span>
              )}
            </p>
          </div>,
        action: <Button variant="outline" size="sm" onClick={handleUndo}>
            Undo
          </Button>
      });
      setHasUnsavedChanges(false);
      setShowUndoToast(true);

      // Auto-hide undo option after 10 seconds
      setTimeout(() => {
        setShowUndoToast(false);
        setLastSavedData(null);
      }, 10000);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the schedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }
  function handleUndo() {
    if (lastSavedData) {
      onSave(lastSavedData);
      setScheduleData(lastSavedData);
      setShowUndoToast(false);
      setLastSavedData(null);
      toast({
        title: "Changes Undone",
        description: "Schedule has been reverted to previous state."
      });
    }
  }
  function handleCancel() {
    if (hasUnsavedChanges) {
      // In a real app, you might want to show a confirmation dialog
      const confirm = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (!confirm) return;
    }
    onOpenChange(false);
  }
  // Note: updateScheduleData removed - was kept for potential future use with single-week mode but never used
  function updateTimeOffData(updates: TimeOffRequest[]) {
    setTimeOffData(updates);
    setHasUnsavedChanges(true);
  }

  // Multi-week handlers
  function handlePatternTypeChange(type: PatternType) {
    setPatternType(type);
    if (type === 'fixed') {
      setPatternWeeks(1);
      setSelectedWeek(0);
    }
    setHasUnsavedChanges(true);
  }

  function handlePatternWeeksChange(weeks: number) {
    setPatternWeeks(weeks);
    // Ensure we have enough week schedules
    setWeekSchedules(prev => {
      const newSchedules = [...prev];
      while (newSchedules.length < weeks) {
        newSchedules.push({
          staffId: selectedStaffId,
          schedule: {},
          repeatRules: {},
          notes: {}
        });
      }
      return newSchedules.slice(0, weeks);
    });
    // Reset to week 0 if current week is beyond new count
    if (selectedWeek >= weeks) {
      setSelectedWeek(0);
    }
    setHasUnsavedChanges(true);
  }

  function handleWeekUpdate(weekIndex: number, updates: Partial<ScheduleData>) {
    setWeekSchedules(prev => {
      const newSchedules = [...prev];
      newSchedules[weekIndex] = {
        ...newSchedules[weekIndex],
        ...updates
      };
      return newSchedules;
    });
    // Also update scheduleData for backward compatibility (uses week 0 for fixed patterns)
    if (weekIndex === 0 || patternType === 'fixed') {
      setScheduleData(prev => ({
        ...prev,
        ...updates
      }));
    }
    setHasUnsavedChanges(true);
  }
  const summary = getWeeklySummary();
  return <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-full sm:w-[600px] md:w-[700px] lg:w-[800px] xl:max-w-4xl flex flex-col p-4 sm:p-6">
        <SheetHeader className="pb-3 sm:pb-4 border-b border-border flex-shrink-0">
          <SheetTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            Add/Edit Schedule
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4 sm:space-y-6 min-h-0">
          {/* Staff Selection - Always show for consistency */}
          <div className="space-y-3 sm:space-y-4 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
            <div className="w-full">
              <Popover open={openStaffSelect} onOpenChange={setOpenStaffSelect}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openStaffSelect} className="w-full justify-between h-10 sm:h-auto text-sm sm:text-base">
                    {selectedStaffId ? staffList.find(staff => staff.id === selectedStaffId)?.name : "Choose a staff member..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-background border shadow-md z-50 max-h-[60vh] overflow-hidden">
                  <Command>
                    <CommandInput placeholder="Search staff..." className="h-9 flex-shrink-0" />
                    <CommandList className="overflow-y-auto max-h-[50vh]">
                      <CommandEmpty>No staff member found.</CommandEmpty>
                      <CommandGroup>
                        {staffList.map(staff => <CommandItem key={staff.id} value={staff.name} onSelect={() => {
                        setSelectedStaffId(staff.id === selectedStaffId ? "" : staff.id);
                        setOpenStaffSelect(false);
                      }} className="py-2">
                            <div className="flex items-center gap-3 w-full">
                              <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                                <AvatarImage src={staff.avatar} />
                                <AvatarFallback className="text-xs">{staff.initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium text-sm sm:text-base">{staff.name}</div>
                                <div className="text-xs text-muted-foreground">{staff.position}</div>
                              </div>
                              <Check className={cn("ml-auto h-4 w-4", selectedStaffId === staff.id ? "opacity-100" : "opacity-0")} />
                            </div>
                          </CommandItem>)}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
            
          {/* Staff Summary Info - Show when staff is selected */}
          {selectedStaff && (
            <div className="space-y-3 sm:space-y-4 pb-3 sm:pb-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  <AvatarImage src={selectedStaff.avatar} />
                  <AvatarFallback className="text-sm">{selectedStaff.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-base truncate">{selectedStaff.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">{selectedStaff.position}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs h-5 px-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {summary.totalHours}h/week
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          {selectedStaffId && <div className="flex-1 overflow-hidden min-h-0">
              <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10 flex-shrink-0">
                  <TabsTrigger value="regular" className="text-xs sm:text-sm px-2">Regular</TabsTrigger>
                  <TabsTrigger value="expanded" className="text-xs sm:text-sm px-2">Day View</TabsTrigger>
                  <TabsTrigger value="timeoff" className="text-xs sm:text-sm px-2 flex items-center gap-1">
                    <span className="hidden sm:inline">Time Off</span>
                    <span className="sm:hidden">Off</span>
                    {timeOffData.filter(request => request.status === "pending").length > 0 && <Badge className="ml-1 bg-warning text-warning-foreground text-xs h-4 px-1 min-w-4 flex items-center justify-center">
                        {timeOffData.filter(request => request.status === "pending").length}
                      </Badge>}
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden min-h-0">
                  <TabsContent value="regular" className="h-full mt-3 sm:mt-4 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 min-h-0">
                      <MultiWeekScheduleWrapper
                        weekSchedules={weekSchedules}
                        patternType={patternType}
                        patternWeeks={patternWeeks}
                        onPatternTypeChange={handlePatternTypeChange}
                        onPatternWeeksChange={handlePatternWeeksChange}
                        onWeekUpdate={handleWeekUpdate}
                        onSwitchToDay={(day) => {
                          setActiveTab("expanded");
                          setSelectedDay(day);
                        }}
                        selectedWeek={selectedWeek}
                        onSelectedWeekChange={setSelectedWeek}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="expanded" className="h-full mt-3 sm:mt-4 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 min-h-0">
                      <ExpandedDayTab
                        scheduleData={weekSchedules[selectedWeek] || scheduleData}
                        selectedDay={selectedDay}
                        onDayChange={setSelectedDay}
                        onUpdate={(updates) => handleWeekUpdate(selectedWeek, updates)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="timeoff" className="h-full mt-3 sm:mt-4 overflow-y-auto data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 min-h-0">
                      <TimeOffTab staffMember={selectedStaff!} timeOffRequests={timeOffData} onUpdate={updateTimeOffData} />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
             </div>}
        </div>

        {/* Footer with Cancel and Save buttons */}
        {selectedStaffId && (
          <div className="flex-shrink-0 border-t border-border pt-4 mt-4">
            {/* Validation warnings */}
            {summary.conflicts.length > 0 && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Schedule Conflicts Detected</p>
                    <ul className="text-xs text-destructive/80 mt-1 space-y-0.5">
                      {summary.conflicts.map((conflict, index) => (
                        <li key={index}>• {conflict.day}: {conflict.reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                <span>You have unsaved changes</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 sm:flex-initial sm:min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className="flex-1 sm:flex-initial sm:min-w-[100px]"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Schedule
                  </>
                )}
              </Button>
            </div>

            {/* Save shortcut hint */}
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Press Ctrl+S to save quickly
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>;
}