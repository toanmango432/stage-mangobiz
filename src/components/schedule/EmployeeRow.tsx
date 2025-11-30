import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Star, Zap, Coffee } from "lucide-react";
import { FutureTimeOffChip } from "./FutureTimeOffChip";
import { ShiftContextMenu } from "./ShiftContextMenu";
import { OffCellContextMenu } from "./OffCellContextMenu";
import { NotScheduledContextMenu } from "./NotScheduledContextMenu";
import { SetOffDayDialog } from "./SetOffDayDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Utility function to generate display names with nickname conflict resolution
const getDisplayName = (employees: { id: string; name: string; nickname: string; position: string; duration: string; avatar: string; initials: string; }[], employeeId: string) => {
  const targetEmployee = employees.find(emp => emp.id === employeeId);
  if (!targetEmployee) return '';
  
  const nickname = targetEmployee.nickname;
  const sameNicknames = employees.filter(emp => emp.nickname === nickname);
  
  if (sameNicknames.length === 1) {
    // No conflict - use nickname only
    return nickname;
  } else {
    // Conflict - append first letter of last name
    const lastName = targetEmployee.name.split(' ').pop() || '';
    const lastNameInitial = lastName.charAt(0).toUpperCase();
    return `${nickname} ${lastNameInitial}.`;
  }
};

interface TimeSlot {
  start: string;
  end: string;
  type?: "normal" | "extra" | "off";
  reason?: string; // For time off reasons
  breakStart?: string; // Start time of partial time off break
  breakEnd?: string; // End time of partial time off break
}

interface FutureTimeOffRequest {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
}

interface FullTimeSettings {
  minHoursPerWeek: number;
  minDaysPerWeek: number;
  consecutiveHoursThreshold: number;
  overtimeThreshold: number;
  enableMinHours: boolean;
  enableMinDays: boolean;
  enableConsecutiveHours: boolean;
  enableOvertime: boolean;
}

interface EmployeeRowProps {
  employee: {
    id: string;
    name: string;
    nickname: string;
    position: string;
    duration: string;
    avatar: string;
    initials: string;
  };
  schedule: {
    [key: string]: TimeSlot[];
  };
  futureTimeOff: FutureTimeOffRequest[];
  onTimeOffChipClick?: (employeeId: string, date: string) => void;
  onEditSchedule?: (staffId: string, tab?: "regular" | "expanded" | "timeoff", day?: string) => void;
  onSetOffDay?: (staffId: string, day: string, reason?: string) => void;
  onRemoveOffDay?: (staffId: string, day: string) => void;
  compactView?: boolean;
  fullTimeSettings?: FullTimeSettings;
}

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Utility function to classify employment status based on weekly schedule and settings
const classifyEmploymentStatus = (weeklyHours: number, workingDays: number, settings?: FullTimeSettings) => {
  if (!settings) return null;
  
  const { 
    minHoursPerWeek, 
    minDaysPerWeek, 
    overtimeThreshold,
    enableMinHours,
    enableMinDays,
    enableOvertime 
  } = settings;
  
  // Check if employee meets overtime criteria
  if (enableOvertime && weeklyHours >= overtimeThreshold) {
    return { status: "Overtime", badge: "OT", color: "bg-orange-500 hover:bg-orange-600 text-white" };
  }
  
  // Check if employee meets all enabled full-time criteria
  const meetsHoursCriteria = !enableMinHours || weeklyHours >= minHoursPerWeek;
  const meetsDaysCriteria = !enableMinDays || workingDays >= minDaysPerWeek;
  
  if (meetsHoursCriteria && meetsDaysCriteria) {
    return { status: "Full-Time", badge: "FT", color: "bg-green-500 hover:bg-green-600 text-white" };
  }
  
  return { status: "Part-Time", badge: "PT", color: "bg-blue-500 hover:bg-blue-600 text-white" };
};

export function EmployeeRow({ 
  employee, 
  schedule, 
  futureTimeOff = [], 
  onTimeOffChipClick, 
  onEditSchedule, 
  onSetOffDay, 
  onRemoveOffDay,
  compactView = false,
  fullTimeSettings
}: EmployeeRowProps) {
  const { toast } = useToast();
  const [offDayDialog, setOffDayDialog] = useState<{ open: boolean; day: string }>({ 
    open: false, 
    day: "" 
  });

  const handleSetOffDay = (day: string) => {
    setOffDayDialog({ open: true, day });
  };

  const handleConfirmOffDay = (reason: string) => {
    onSetOffDay?.(employee.id, offDayDialog.day, reason);
    toast({
      title: "Off Day Set",
      description: `${displayName} is now off on ${offDayDialog.day}. Reason: ${reason}`,
    });
  };
  // Mock employees for conflict resolution - in real app this would come from props or context
  const mockEmployees = [
    { id: "1", name: "Amelia Johnson", nickname: "Amelia", position: "Senior Stylist", duration: "7+h 25min", avatar: "", initials: "AM" },
    { id: "2", name: "Bella Henderson", nickname: "Bella", position: "Colorist", duration: "6+h 36min", avatar: "", initials: "BE" },
    { id: "3", name: "Charlotte Johnson", nickname: "Charlotte", position: "Stylist", duration: "8+h", avatar: "", initials: "CH" },
    { id: "4", name: "Daisy Oliver", nickname: "Daisy", position: "Junior Stylist", duration: "7+h", avatar: "", initials: "DA" },
    { id: "5", name: "Emma Smith", nickname: "Emma", position: "Stylist", duration: "6+h 15min", avatar: "", initials: "EM" },
    { id: "6", name: "Fiona King", nickname: "Fiona", position: "Manager", duration: "8+h 30min", avatar: "", initials: "FI" },
    { id: "7", name: "Grace Miller", nickname: "Grace", position: "Colorist", duration: "7+h 45min", avatar: "", initials: "GR" },
    { id: "9", name: "Hannah Lewis", nickname: "Hannah", position: "Receptionist", duration: "5+h 20min", avatar: "", initials: "HA" },
    { id: "10", name: "Isabella Rodriguez", nickname: "Isabella", position: "Senior Stylist", duration: "8+h 10min", avatar: "", initials: "IS" },
    { id: "11", name: "Julia Thompson", nickname: "Julia", position: "Assistant", duration: "6+h 50min", avatar: "", initials: "JU" },
    { id: "12", name: "Kate Wilson", nickname: "Kate", position: "Stylist", duration: "7+h 30min", avatar: "", initials: "KA" },
    { id: "13", name: "Lily Peterson", nickname: "Lily", position: "Colorist", duration: "8+h 15min", avatar: "", initials: "LI" },
    { id: "14", name: "Maya Brown", nickname: "Maya", position: "Assistant", duration: "6+h 40min", avatar: "", initials: "MA" },
    { id: "15", name: "Nina Davis", nickname: "Nina", position: "Stylist", duration: "7+h 55min", avatar: "", initials: "NI" },
    { id: "16", name: "Alex Carter", nickname: "Alex", position: "Colorist", duration: "8+h 20min", avatar: "", initials: "AC" },
    { id: "17", name: "Alex Thompson", nickname: "Alex", position: "Stylist", duration: "7+h 10min", avatar: "", initials: "AT" },
  ];
  
  const displayName = getDisplayName(mockEmployees, employee.id);
  
  // Helper function to calculate total hours for a day - must be defined first
  const calculateTotalHours = (daySlots: TimeSlot[]) => {
    if (!daySlots || daySlots.length === 0) return 0;
    
    let totalMinutes = 0;
    daySlots.forEach(slot => {
      if (slot.type === "off" || !slot.start || !slot.end) return;
      
      // Parse time strings (e.g., "9a", "12p", "9p")
      const parseTime = (timeStr: string) => {
        const time = timeStr.toLowerCase();
        const isAM = time.includes('a');
        const isPM = time.includes('p');
        const hour = parseInt(time.replace(/[ap]/g, ''));
        
        if (isPM && hour !== 12) return hour + 12;
        if (isAM && hour === 12) return 0;
        return hour;
      };
      
      const startHour = parseTime(slot.start);
      const endHour = parseTime(slot.end);
      let duration = endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
      
      // Subtract break time if partial time off exists
      if (slot.breakStart && slot.breakEnd) {
        const breakStartHour = parseTime(slot.breakStart);
        const breakEndHour = parseTime(slot.breakEnd);
        const breakDuration = breakEndHour > breakStartHour ? breakEndHour - breakStartHour : (24 - breakStartHour) + breakEndHour;
        duration -= breakDuration;
      }
      
      totalMinutes += duration * 60;
    });
    
    return totalMinutes / 60;
  };

  // Calculate total weekly hours and working days for this employee
  const calculateWeeklyHours = () => {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    let totalHours = 0;
    
    days.forEach(day => {
      const daySlots = schedule[day] || [];
      totalHours += calculateTotalHours(daySlots);
    });
    
    return totalHours;
  };

  const calculateWorkingDays = () => {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    let workingDays = 0;
    
    days.forEach(day => {
      const daySlots = schedule[day] || [];
      // Count as working day if there are any non-off slots
      const hasWork = daySlots.some(slot => slot.type !== "off" && slot.start && slot.end);
      if (hasWork) workingDays++;
    });
    
    return workingDays;
  };

  // Get employment status classification
  const weeklyHours = Math.round(calculateWeeklyHours() * 10) / 10;
  const workingDays = calculateWorkingDays();
  const employmentStatus = classifyEmploymentStatus(weeklyHours, workingDays, fullTimeSettings);

  // Helper function to split a shift when there's partial time off
  const splitShiftWithBreak = (slot: TimeSlot): TimeSlot[] => {
    if (!slot.breakStart || !slot.breakEnd) return [slot];
    
    return [
      {
        ...slot,
        end: slot.breakStart,
        breakStart: undefined,
        breakEnd: undefined
      },
      {
        ...slot,
        start: slot.breakEnd,
        breakStart: undefined,
        breakEnd: undefined
      }
    ];
  };

  const renderTimeSlots = (daySlots: TimeSlot[], day: string) => {
    if (!daySlots || daySlots.length === 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <NotScheduledContextMenu
                onAddDaySchedule={() => onEditSchedule?.(employee.id, "expanded", day)}
                onEditRegular={() => onEditSchedule?.(employee.id, "regular")}
                staffName={displayName}
                day={day}
              >
                <div className={`w-full bg-muted rounded-lg flex items-center justify-between cursor-pointer apple-transition hover:bg-muted/80 border border-muted-foreground/20 group ${
                  compactView 
                    ? 'px-2 py-2 h-10' 
                    : 'px-3 py-3 h-14 sm:h-16'
                }`}>
                  <span className={`font-medium text-muted-foreground flex-1 truncate ${
                    compactView 
                      ? 'text-[10px] sm:text-xs' 
                      : 'text-xs sm:text-sm'
                  }`}>Not Scheduled</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-0 opacity-0 group-hover:opacity-100 apple-transition bg-primary/10 hover:bg-primary/20 text-primary ${
                      compactView ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Button is now just visual, context menu handles functionality
                    }}
                    aria-label={`Add schedule for ${displayName}`}
                  >
                    <Plus className={compactView ? 'w-2 h-2' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'} />
                  </Button>
                </div>
              </NotScheduledContextMenu>
            </TooltipTrigger>
            <TooltipContent className="apple-shadow-md">
              <div className="text-center">
                <p>No shifts scheduled for {displayName}</p>
                <p className="text-xs opacity-60 mt-1">Right-click for options</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    const totalHours = calculateTotalHours(daySlots);
    
    // Check for partial time off and create split shifts
    const processedSlots: TimeSlot[] = [];
    let hasPartialTimeOff = false;
    let breakInfo: { start: string; end: string } | null = null;
    
    daySlots.forEach(slot => {
      if (slot.breakStart && slot.breakEnd) {
        hasPartialTimeOff = true;
        breakInfo = { start: slot.breakStart, end: slot.breakEnd };
        processedSlots.push(...splitShiftWithBreak(slot));
      } else {
        processedSlots.push(slot);
      }
    });
    
    const isMultipleShifts = processedSlots.length > 1;
    const hasTimeOff = processedSlots.some(slot => slot.type === "off");

    // Calculate break duration for display
    const calculateBreakDuration = (breakStart: string, breakEnd: string) => {
      const parseTime = (timeStr: string) => {
        const time = timeStr.toLowerCase();
        const isAM = time.includes('a');
        const isPM = time.includes('p');
        let hour = parseInt(time.replace(/[ap]/g, ''));
        
        // Handle minutes (e.g., "12:30p")
        const minuteMatch = timeStr.match(/(\d+):(\d+)/);
        const minutes = minuteMatch ? parseInt(minuteMatch[2]) : 0;
        
        if (isPM && hour !== 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
        
        return hour + minutes / 60;
      };
      
      const startTime = parseTime(breakStart);
      const endTime = parseTime(breakEnd);
      const duration = endTime - startTime;
      
      if (duration === 1) return "1h";
      if (duration < 1) return `${Math.round(duration * 60)}min`;
      if (duration % 1 === 0) return `${duration}h`;
      
      const hours = Math.floor(duration);
      const minutes = Math.round((duration % 1) * 60);
      return `${hours}h ${minutes}min`;
    };

    // For multiple shifts or split shifts (partial time off), display them vertically stacked
    if (isMultipleShifts && !hasTimeOff) {
      return (
        <div className={`space-y-0 ${compactView ? 'h-auto' : 'h-auto'}`}>
          {processedSlots.map((slot, index) => {
            const shiftDuration = (() => {
              if (!slot.start || !slot.end) return "0h";
              const parseTime = (timeStr: string) => {
                const time = timeStr.toLowerCase();
                const isAM = time.includes('a');
                const isPM = time.includes('p');
                const hour = parseInt(time.replace(/[ap]/g, ''));
                
                if (isPM && hour !== 12) return hour + 12;
                if (isAM && hour === 12) return 0;
                return hour;
              };
              
              const startHour = parseTime(slot.start);
              const endHour = parseTime(slot.end);
              const duration = endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
              return `${duration}h`;
            })();

            return (
              <div key={index}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <ShiftContextMenu
                         onEditDay={() => onEditSchedule?.(employee.id, "expanded", day)}
                         onEditRegular={() => onEditSchedule?.(employee.id, "regular")}
                         onSetOffDay={() => handleSetOffDay(day)}
                         staffName={displayName}
                         day={day}
                       >
                        <Button
                          variant="default"
                          size="sm"
                          className={`w-full font-medium rounded-md apple-shadow-sm apple-transition ${
                            slot.type === "extra" 
                              ? "bg-primary hover:bg-primary-hover text-primary-foreground" 
                              : totalHours >= 10
                              ? "bg-primary hover:bg-primary-hover text-primary-foreground"
                              : "bg-light-blue hover:bg-light-blue/80 text-light-blue-foreground"
                          } ${
                            compactView 
                              ? 'px-2 py-1 h-7 text-[9px] sm:text-[10px]' 
                              : 'px-2.5 py-1.5 h-8 sm:h-9 text-[10px] sm:text-xs'
                           }`}
                        >
                          <div className="flex items-center justify-center gap-1 w-full">
                            {slot.type === "extra" && (
                              <Zap className={`${compactView ? 'w-2 h-2' : 'w-2.5 h-2.5'} flex-shrink-0`} />
                            )}
                            <span className="truncate text-center">
                              {compactView ? (
                                <>{slot.start}-{slot.end}</>
                              ) : (
                                <>{slot.start} - {slot.end}</>
                              )}
                            </span>
                          </div>
                        </Button>
                      </ShiftContextMenu>
                    </TooltipTrigger>
                    <TooltipContent className="apple-shadow-md">
                      <div className="text-center">
                        <p className="font-medium">{slot.start} - {slot.end}</p>
                        <p className="text-xs opacity-80">Duration: {shiftDuration}</p>
                        {slot.type === "extra" && (
                          <div className="flex items-center gap-1 justify-center">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <p className="text-xs opacity-80">Extra Shift</p>
                          </div>
                        )}
                        <p className="text-xs opacity-60 mt-1">
                          {hasPartialTimeOff ? `Working segment ${index + 1} of ${processedSlots.length}` : `Shift ${index + 1} of ${processedSlots.length}`}
                        </p>
                        {hasPartialTimeOff && breakInfo && (
                          <p className="text-xs opacity-80 mt-1">
                            Break: {breakInfo.start} - {breakInfo.end} ({calculateBreakDuration(breakInfo.start, breakInfo.end)})
                          </p>
                        )}
                         <p className="text-xs opacity-60 mt-1">
                           Click for options
                         </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Break indicator between working segments */}
                {hasPartialTimeOff && index === 0 && breakInfo && (
                  <div className={`flex items-center justify-center my-0.5 ${compactView ? 'h-5' : 'h-6'}`}>
                    <div className={`bg-muted/80 rounded-lg border border-dashed border-muted-foreground/40 flex items-center justify-center gap-1 px-2 ${
                      compactView ? 'py-0.5 h-4' : 'py-1 h-5'
                    }`}>
                      <Coffee className={`text-muted-foreground ${compactView ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
                      <span className={`text-muted-foreground font-medium ${
                        compactView ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'
                      }`}>
                        {compactView ? 
                          `${calculateBreakDuration(breakInfo.start, breakInfo.end)} OFF` : 
                          `${breakInfo.start}-${breakInfo.end} BREAK`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Single shift or time off - use full width
    const slot = processedSlots[0];
    
    if (slot.type === "off") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <OffCellContextMenu
                onEditDay={() => onEditSchedule?.(employee.id, "expanded", day)}
                onEditRegular={() => onEditSchedule?.(employee.id, "regular")}
                onRemoveOffDay={() => onRemoveOffDay?.(employee.id, day)}
                staffName={displayName}
                day={day}
                reason={slot.reason}
              >
                <div className={`bg-muted rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 apple-shadow-sm border border-muted-foreground/20 transition-colors ${
                  compactView 
                    ? 'px-2 py-2 h-10' 
                    : 'px-3 py-3 h-14 sm:h-16'
                }`}>
                  <div className={`text-destructive line-through font-medium leading-tight ${
                    compactView ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm'
                  }`}>
                    {slot.start && slot.end ? `${slot.start} - ${slot.end}` : '9:30a - 7p'}
                  </div>
                  <div className={`text-destructive leading-tight ${
                    compactView ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'
                  }`}>
                    <span className="font-bold">OFF</span>
                    <span className="font-normal"> - {slot.reason || 'Personal'}</span>
                  </div>
                </div>
              </OffCellContextMenu>
            </TooltipTrigger>
            <TooltipContent className="apple-shadow-md">
              <div className="text-center">
                <p>Time off - {slot.reason || 'Personal'}</p>
                <p className="text-xs opacity-60 mt-1">Right-click for options</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    const shiftDuration = (() => {
      if (!slot.start || !slot.end) return "0h";
      const parseTime = (timeStr: string) => {
        const time = timeStr.toLowerCase();
        const isAM = time.includes('a');
        const isPM = time.includes('p');
        const hour = parseInt(time.replace(/[ap]/g, ''));
        
        if (isPM && hour !== 12) return hour + 12;
        if (isAM && hour === 12) return 0;
        return hour;
      };
      
      const startHour = parseTime(slot.start);
      const endHour = parseTime(slot.end);
      const duration = endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
      return `${duration}h`;
    })();
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
             <ShiftContextMenu
               onEditDay={() => onEditSchedule?.(employee.id, "expanded", day)}
               onEditRegular={() => onEditSchedule?.(employee.id, "regular")}
               onSetOffDay={() => handleSetOffDay(day)}
               staffName={displayName}
               day={day}
             >
              <Button
                variant="default"
                size="sm"
                className={`w-full font-medium rounded-lg apple-shadow-sm apple-transition ${
                  slot.type === "extra" 
                    ? "bg-primary hover:bg-primary-hover text-primary-foreground" 
                    : totalHours >= 10
                    ? "bg-primary hover:bg-primary-hover text-primary-foreground"
                    : "bg-light-blue hover:bg-light-blue/80 text-light-blue-foreground"
                } ${
                  compactView 
                    ? 'px-2 py-2 h-10 text-xs' 
                    : 'px-3 py-3 h-14 sm:h-16 text-sm'
                }`}
              >
                {slot.type === "extra" ? (
                  <span className="flex items-center gap-1">
                    <Zap className={compactView ? 'w-2 h-2' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'} />
                    <span className="truncate">{slot.start} - {slot.end}</span>
                  </span>
                ) : (
                  <span className="truncate">{slot.start} - {slot.end}</span>
                )}
              </Button>
            </ShiftContextMenu>
          </TooltipTrigger>
          <TooltipContent className="apple-shadow-md">
            <div className="text-center">
              <p className="font-medium">{slot.start} - {slot.end}</p>
              <p className="text-xs opacity-80">Duration: {shiftDuration}</p>
              {slot.type === "extra" && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <p className="text-xs opacity-80">Extra Shift</p>
                </div>
              )}
              {totalHours < 10 && (
                <p className="text-xs opacity-80">Part-time</p>
              )}
               <p className="text-xs opacity-60 mt-1">
                 Click for options
               </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="bg-card hover:bg-muted/20 apple-transition border-b border-border/50 relative">
      {/* Responsive layout with optimized spacing for all devices */}
      <div className={`flex items-center min-w-fit ${
        compactView 
          ? 'gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-2.5 lg:p-3' 
          : 'gap-2 sm:gap-3 lg:gap-4 p-2.5 sm:p-3 lg:p-6'
      }`}>
        {/* Staff column - Optimized width for tablet and mobile */}
        <div className={`sticky left-0 z-30 bg-card shadow-sm sm:shadow-md border-r border-border/30 flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0 -ml-2.5 sm:-ml-3 lg:-ml-6 pl-2.5 sm:pl-3 lg:pl-6 pr-1.5 sm:pr-2 lg:pr-3 ${
          compactView 
            ? 'w-24 sm:w-28 md:w-32 lg:w-36' 
            : 'w-28 sm:w-32 md:w-36 lg:w-40'
        }`}>
          <Avatar 
            className={`apple-shadow-sm flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${
              compactView 
                ? 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7' 
                : 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8'
            }`}
            onClick={() => onEditSchedule?.(employee.id, "regular")}
          >
            <AvatarImage src={employee.avatar} className="object-cover" />
            <AvatarFallback className={`bg-primary/10 text-primary font-semibold ${
              compactView 
                ? 'text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px]' 
                : 'text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs'
            }`}>
              {employee.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div 
              className={`font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors ${
                compactView 
                  ? 'text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px]' 
                  : 'text-[9px] sm:text-[10px] md:text-xs lg:text-xs'
              }`}
              onClick={() => onEditSchedule?.(employee.id, "regular")}
            >
              {displayName}
            </div>
            <div className={`text-muted-foreground truncate ${
              compactView 
                ? 'text-[7px] sm:text-[8px] md:text-[9px] lg:text-[9px]' 
                : 'text-[8px] sm:text-[9px] md:text-[10px] lg:text-[10px]'
            }`}>
              {employee.position}
            </div>
            {!compactView && (
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                <Badge variant="secondary" className={`font-medium ${
                  compactView 
                    ? 'text-[7px] sm:text-[8px] md:text-[9px] lg:text-[9px] px-1 py-0' 
                    : 'text-[8px] sm:text-[9px] md:text-[10px] lg:text-[10px] px-1 sm:px-1.5 py-0 sm:py-0.5'
                }`}>
                  {weeklyHours}h
                </Badge>
                {employmentStatus && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          className={`font-medium ${employmentStatus.color} ${
                            compactView 
                              ? 'text-[7px] sm:text-[8px] md:text-[9px] lg:text-[9px] px-1 py-0' 
                              : 'text-[8px] sm:text-[9px] md:text-[10px] lg:text-[10px] px-1 sm:px-1.5 py-0 sm:py-0.5'
                          }`}
                        >
                          {employmentStatus.badge}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="apple-shadow-md">
                        <div className="text-center">
                          <p className="font-medium">{employmentStatus.status}</p>
                          <p className="text-xs opacity-80 mt-1">
                            {weeklyHours}h / {workingDays} days
                          </p>
                          {fullTimeSettings && (
                            <div className="text-xs opacity-70 mt-1 space-y-0.5">
                              {fullTimeSettings.enableMinHours && (
                                <p>Min hours: {fullTimeSettings.minHoursPerWeek}h {weeklyHours >= fullTimeSettings.minHoursPerWeek ? '✓' : '✗'}</p>
                              )}
                              {fullTimeSettings.enableMinDays && (
                                <p>Min days: {fullTimeSettings.minDaysPerWeek} {workingDays >= fullTimeSettings.minDaysPerWeek ? '✓' : '✗'}</p>
                              )}
                              {fullTimeSettings.enableOvertime && weeklyHours >= fullTimeSettings.overtimeThreshold && (
                                <p className="text-orange-400">Overtime threshold: {fullTimeSettings.overtimeThreshold}h</p>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Day columns - Responsive flex layout optimized for touch */}
        <div className={`flex flex-1 ${
          compactView 
            ? 'gap-1.5 sm:gap-2 md:gap-3 lg:gap-4' 
            : 'gap-2 sm:gap-2.5 md:gap-3 lg:gap-4'
        }`}>
          {days.map((day, dayIndex) => (
            <div 
              key={day} 
              className={`flex items-center justify-center flex-1 ${
                compactView 
                  ? 'min-w-[60px] sm:min-w-[70px] md:min-w-[85px] lg:min-w-[100px]' 
                  : 'min-w-[70px] sm:min-w-[85px] md:min-w-[100px] lg:min-w-[120px]'
              }`}
            >
              <div className="w-full">
                {renderTimeSlots(schedule[day] || [], day)}
                {/* Show future time off chips only on larger screens or when not compact */}
                {(schedule[day] && schedule[day].length > 0) && !compactView && (
                  <div className="mt-1 hidden sm:block">
                    <FutureTimeOffChip 
                      employeeId={employee.id}
                      weekdayIndex={dayIndex}
                      weekdayName={day}
                      futureRequests={futureTimeOff}
                      onChipClick={onTimeOffChipClick}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <SetOffDayDialog
        open={offDayDialog.open}
        onOpenChange={(open) => setOffDayDialog({ open, day: offDayDialog.day })}
        staffName={displayName}
        day={offDayDialog.day}
        onConfirm={handleConfirmOffDay}
      />
    </div>
  );
}