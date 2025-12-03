import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  MoreVertical,
  Info,
  Users,
  Plus,
  CalendarX,
  Settings,
  LayoutGrid,
  Rows,
  Zap
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScheduleHeader } from "./ScheduleHeader";
import { EmployeeRow } from "./EmployeeRow";
import { TimeOffModal } from "../TimeOff/TimeOffModal";
import { AddEditScheduleModal } from "./AddEditScheduleModal";
import type { ScheduleData, TimeOffRequest } from "./AddEditScheduleModal";
import { ScheduleStats } from "./ScheduleStats";
import { ScheduleFilters, FilterState } from "./ScheduleFilters";
import { OnboardingTips } from "./OnboardingTips";
import { SalonHoursBar } from "./SalonHoursBar";
import { SettingsModal, AppSettings } from "./SettingsModal";
import { ActivityFeed, ScheduleActivity } from "./ActivityFeed";
import { useStaffSchedulesForWeek, UIScheduleByStaff } from "@/hooks/useStaffSchedules";

const mockEmployees = [
  {
    id: "1", 
    name: "Amelia Johnson",
    nickname: "Amelia",
    position: "Senior Stylist",
    duration: "7+h 25min",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b776?w=40&h=40&fit=crop&crop=face",
    initials: "AM",
  },
  {
    id: "2",
    name: "Bella Henderson",
    nickname: "Bella",
    position: "Colorist", 
    duration: "6+h 36min", 
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    initials: "BE",
  },
  {
    id: "3",
    name: "Charlotte Johnson",
    nickname: "Charlotte",
    position: "Stylist",
    duration: "8+h",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    initials: "CH",
  },
  {
    id: "4",
    name: "Daisy Oliver",
    nickname: "Daisy",
    position: "Junior Stylist",
    duration: "7+h",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face",
    initials: "DA",
  },
  {
    id: "5",
    name: "Emma Smith",
    nickname: "Emma",
    position: "Stylist",
    duration: "6+h 15min",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    initials: "EM",
  },
  {
    id: "6",
    name: "Fiona King",
    nickname: "Fiona",
    position: "Manager",
    duration: "8+h 30min",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
    initials: "FI",
  },
  {
    id: "7",
    name: "Grace Miller",
    nickname: "Grace",
    position: "Colorist",
    duration: "7+h 45min",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face",
    initials: "GR",
  },
  {
    id: "9",
    name: "Hannah Lewis",
    nickname: "Hannah",
    position: "Receptionist",
    duration: "5+h 20min",
    avatar: "https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=40&h=40&fit=crop&crop=face",
    initials: "HA",
  },
  {
    id: "10",
    name: "Isabella Rodriguez",
    nickname: "Isabella",
    position: "Senior Stylist",
    duration: "8+h 10min",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=40&h=40&fit=crop&crop=face",
    initials: "IS",
  },
  {
    id: "11",
    name: "Julia Thompson",
    nickname: "Julia",
    position: "Assistant",
    duration: "6+h 50min",
    avatar: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=40&h=40&fit=crop&crop=face",
    initials: "JU",
  },
  {
    id: "12",
    name: "Kate Wilson",
    nickname: "Kate",
    position: "Stylist",
    duration: "7+h 30min",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
    initials: "KA",
  },
  {
    id: "13",
    name: "Lily Peterson",
    nickname: "Lily",
    position: "Colorist",
    duration: "8+h 15min",
    avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=40&h=40&fit=crop&crop=face",
    initials: "LI",
  },
  {
    id: "14",
    name: "Maya Brown",
    nickname: "Maya",
    position: "Assistant",
    duration: "6+h 40min",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face",
    initials: "MA",
  },
  {
    id: "15",
    name: "Nina Davis",
    nickname: "Nina",
    position: "Stylist",
    duration: "7+h 55min",
    avatar: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=40&h=40&fit=crop&crop=face",
    initials: "NI",
  },
  {
    id: "16",
    name: "Alex Carter",
    nickname: "Alex",
    position: "Colorist",
    duration: "8+h 20min",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    initials: "AC",
  },
  {
    id: "17",
    name: "Alex Thompson",
    nickname: "Alex",
    position: "Stylist",
    duration: "7+h 10min",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
    initials: "AT",
  },
];

const mockSchedule = {
  "1": {
    MON: [{ start: "10a", end: "3p", breakStart: "12p", breakEnd: "1p" }],
    TUE: [
      { start: "9a", end: "12p" },
      { start: "3p", end: "6p" },
      { start: "8p", end: "9p" }
    ],
    WED: [{ start: "", end: "", type: "off" as const, reason: "Sick Leave" }],
    THU: [{ start: "9a", end: "9p" }],
    FRI: [{ start: "9a", end: "9p", type: "extra" as const }],
    SAT: [{ start: "9a", end: "9p" }],
    SUN: [],
  },
  "2": {
    MON: [
      { start: "9a", end: "12p" },
      { start: "3p", end: "6p" }
    ],
    TUE: [{ start: "9a", end: "9p", breakStart: "1p", breakEnd: "2p" }],
    WED: [{ start: "9a", end: "9p" }],
    THU: [{ start: "9a", end: "9p" }],
    FRI: [{ start: "9a", end: "9p" }],
    SAT: [{ start: "9a", end: "9p" }],
    SUN: [{ start: "9a", end: "9p" }],
  },
  "3": {
    MON: [{ start: "9a", end: "9p" }],
    TUE: [{ start: "9a", end: "9p" }],
    WED: [{ start: "9a", end: "9p" }],
    THU: [{ start: "9a", end: "9p" }],
    FRI: [{ start: "9a", end: "9p" }],
    SAT: [{ start: "9a", end: "9p" }],
    SUN: [{ start: "9a", end: "9p" }],
  },
  "5": {
    MON: [{ start: "9a", end: "9p", breakStart: "12:30p", breakEnd: "1:30p" }],
    TUE: [{ start: "9a", end: "9p", type: "extra" as const }],
    WED: [
      { start: "9a", end: "12p" },
      { start: "3p", end: "6p" },
      { start: "8p", end: "9p" }
    ],
    THU: [{ start: "9a", end: "9p" }],
    FRI: [{ start: "", end: "", type: "off" as const, reason: "Vacation" }],
    SAT: [{ start: "", end: "", type: "off" as const, reason: "Vacation" }],
    SUN: [{ start: "9a", end: "9p" }],
  },
  "6": {
    MON: [{ start: "10a", end: "8p" }],
    TUE: [{ start: "9a", end: "7p" }],
    WED: [{ start: "11a", end: "9p" }],
    THU: [{ start: "", end: "", type: "off" as const, reason: "Personal Day" }],
    FRI: [{ start: "9a", end: "8p" }],
    SAT: [{ start: "10a", end: "6p", type: "extra" as const }],
    SUN: [],
  },
  "7": {
    MON: [{ start: "8a", end: "8p" }],
    TUE: [{ start: "9a", end: "9p" }],
    WED: [{ start: "8a", end: "8p", breakStart: "3p", breakEnd: "4p" }],
    THU: [{ start: "9a", end: "9p" }],
    FRI: [{ start: "8a", end: "8p" }],
    SAT: [{ start: "9a", end: "9p" }],
    SUN: [{ start: "10a", end: "6p" }],
  },
  "8": {
    MON: [
      { start: "9a", end: "1p" },
      { start: "4p", end: "8p" }
    ],
    TUE: [{ start: "10a", end: "9p" }],
    WED: [{ start: "9a", end: "8p", type: "extra" as const }],
    THU: [{ start: "9a", end: "8p" }],
    FRI: [{ start: "10a", end: "9p" }],
    SAT: [{ start: "", end: "", type: "off" as const, reason: "Family Emergency" }],
    SUN: [{ start: "11a", end: "7p" }],
  },
  "9": {
    MON: [{ start: "12p", end: "8p" }],
    TUE: [{ start: "1p", end: "9p" }],
    WED: [{ start: "12p", end: "8p" }],
    THU: [{ start: "1p", end: "9p" }],
    FRI: [{ start: "12p", end: "8p" }],
    SAT: [{ start: "", end: "", type: "off" as const, reason: "Doctor Appointment" }],
    SUN: [{ start: "", end: "", type: "off" as const, reason: "Doctor Appointment" }],
  },
  "10": {
    MON: [{ start: "9a", end: "9p" }],
    TUE: [{ start: "8a", end: "8p" }],
    WED: [{ start: "9a", end: "9p" }],
    THU: [{ start: "8a", end: "8p", type: "extra" as const }],
    FRI: [{ start: "9a", end: "9p" }],
    SAT: [{ start: "8a", end: "8p" }],
    SUN: [{ start: "10a", end: "8p" }],
  },
  "11": {
    MON: [{ start: "11a", end: "7p" }],
    TUE: [{ start: "", end: "", type: "off" as const, reason: "Maternity Leave" }],
    WED: [
      { start: "10a", end: "2p" },
      { start: "5p", end: "9p" }
    ],
    THU: [{ start: "11a", end: "7p" }],
    FRI: [{ start: "10a", end: "8p" }],
    SAT: [{ start: "11a", end: "7p" }],
    SUN: [{ start: "12p", end: "6p" }],
  },
  "12": {
    MON: [{ start: "9a", end: "8p" }],
    TUE: [{ start: "10a", end: "9p" }],
    WED: [{ start: "9a", end: "8p" }],
    THU: [{ start: "10a", end: "9p" }],
    FRI: [{ start: "", end: "", type: "off" as const, reason: "Wedding" }],
    SAT: [{ start: "9a", end: "8p", type: "extra" as const }],
    SUN: [{ start: "11a", end: "7p" }],
  },
  "13": {
    MON: [{ start: "8a", end: "9p" }],
    TUE: [{ start: "8a", end: "9p" }],
    WED: [{ start: "8a", end: "9p" }],
    THU: [{ start: "8a", end: "9p" }],
    FRI: [{ start: "8a", end: "9p" }],
    SAT: [{ start: "", end: "", type: "off" as const, reason: "Bereavement" }],
    SUN: [{ start: "", end: "", type: "off" as const, reason: "Bereavement" }],
  },
  "14": {
    MON: [
      { start: "10a", end: "1p" },
      { start: "3p", end: "7p" }
    ],
    TUE: [{ start: "11a", end: "8p" }],
    WED: [{ start: "10a", end: "7p" }],
    THU: [{ start: "11a", end: "8p" }],
    FRI: [{ start: "10a", end: "7p", type: "extra" as const }],
    SAT: [{ start: "12p", end: "6p" }],
    SUN: [],
  },
  "15": {
    MON: [{ start: "9a", end: "8p" }],
    TUE: [{ start: "10a", end: "9p" }],
    WED: [{ start: "", end: "", type: "off" as const, reason: "Training" }],
    THU: [{ start: "9a", end: "8p" }],
    FRI: [{ start: "10a", end: "9p" }],
    SAT: [{ start: "9a", end: "8p" }],
    SUN: [{ start: "11a", end: "8p", type: "extra" as const }],
  },
};

// Mock future time off requests (next 8 weeks)
const mockFutureTimeOff = [
  // Amelia - off next Tuesday and Thursday in 3 weeks
  { id: "f1", employeeId: "1", date: "2025-09-10", reason: "Dental Appointment" }, // Next Tuesday (Sept 10)
  { id: "f2", employeeId: "1", date: "2025-09-24", reason: "Vacation" }, // Tuesday in 3 weeks
  
  // Bella - off next Friday and recurring Mondays
  { id: "f3", employeeId: "2", date: "2025-09-13", reason: "Personal Day" }, // Next Friday (Sept 13)
  { id: "f4", employeeId: "2", date: "2025-09-16", reason: "Doctor Appointment" }, // Monday in 2 weeks
  { id: "f5", employeeId: "2", date: "2025-09-23", reason: "Doctor Appointment" }, // Monday in 3 weeks
  
  // Charlotte - off Wednesday in 2 weeks
  { id: "f6", employeeId: "3", date: "2025-09-18", reason: "Training" }, // Wednesday in 2 weeks
  
  // Daisy - off next Monday and Friday in 4 weeks, and next Wednesday
  { id: "f7", employeeId: "4", date: "2025-09-09", reason: "Sick Leave" }, // Next Monday (Sept 9)
  { id: "f8", employeeId: "4", date: "2025-10-04", reason: "Wedding" }, // Friday in 4 weeks
  { id: "f11", employeeId: "4", date: "2025-09-11", reason: "Personal Day" }, // Next Wednesday (Sept 11)
  
  // Emma - off Thursday next week and Monday next week
  { id: "f9", employeeId: "5", date: "2025-09-12", reason: "Personal Day" }, // Next Thursday (Sept 12)
  { id: "f12", employeeId: "5", date: "2025-09-09", reason: "Personal Day" }, // Next Monday (Sept 9)
  
  // Frank - off Saturday in 2 weeks
  { id: "f10", employeeId: "6", date: "2025-01-25", reason: "Family Event" }, // Saturday in 2 weeks
];

// Helper to get the Monday of the current week
function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function ScheduleView() {
  const { toast } = useToast();
  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false);
  const [addEditScheduleModalOpen, setAddEditScheduleModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activityFeedOpen, setActivityFeedOpen] = useState(false);
  const [initialStaffId, setInitialStaffId] = useState<string>();
  const [initialTab, setInitialTab] = useState<"regular" | "expanded" | "timeoff">("regular");
  const [initialDay, setInitialDay] = useState("MON");
  const [filteredEmployees, setFilteredEmployees] = useState(mockEmployees);
  const [selectedStaffIds, setSelectedStaffIds] = useState(["all"]);
  const [compactView, setCompactView] = useState(false);
  const [localScheduleOverrides, setLocalScheduleOverrides] = useState<Record<string, Record<string, any[]>>>({});
  const [originalSchedules, setOriginalSchedules] = useState<Record<string, Record<string, any[]>>>({});

  // Week start date for multi-week pattern calculation
  // Note: setWeekStartDate can be used to navigate to different weeks in the future
  const [weekStartDate, _setWeekStartDate] = useState(() => getWeekStartDate());

  // Fetch staff schedules from IndexedDB
  // Note: isLoadingSchedules can be used to show a loading indicator
  const { uiSchedules: dbSchedules, isLoading: _isLoadingSchedules } = useStaffSchedulesForWeek(weekStartDate);

  // Merge IndexedDB schedules with mock data (fallback for staff without schedules)
  const schedule = useMemo(() => {
    const merged: UIScheduleByStaff = { ...mockSchedule };

    // Override with real data from IndexedDB where available
    for (const staffId of Object.keys(dbSchedules)) {
      if (Object.keys(dbSchedules[staffId]).length > 0) {
        merged[staffId] = dbSchedules[staffId];
      }
    }

    // Apply local overrides (e.g., quick off-day changes)
    for (const staffId of Object.keys(localScheduleOverrides)) {
      merged[staffId] = {
        ...merged[staffId],
        ...localScheduleOverrides[staffId],
      };
    }

    return merged;
  }, [dbSchedules, localScheduleOverrides]);
  
  // Mock activity data
  const [activities] = useState<ScheduleActivity[]>([
    {
      id: "1",
      type: "schedule_update",
      title: "Schedule Updated",
      description: "Updated Emily's Tuesday shift from 9:00 AM - 3:00 PM to 10:00 AM - 4:00 PM",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      user: { name: "Sarah Manager", initials: "SM" },
      target: { staff: "Emily Johnson", day: "Tuesday", time: "10:00 AM - 4:00 PM" },
      severity: "success"
    },
    {
      id: "2", 
      type: "shift_added",
      title: "Shift Added",
      description: "Added new shift for Charlotte on Friday",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      user: { name: "Sarah Manager", initials: "SM" },
      target: { staff: "Charlotte Johnson", day: "Friday", time: "2:00 PM - 8:00 PM" },
      severity: "success"
    },
    {
      id: "3",
      type: "time_off", 
      title: "Time Off Approved",
      description: "Approved Grace's vacation request for next week",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      user: { name: "Sarah Manager", initials: "SM" },
      target: { staff: "Grace Miller", day: "Mon-Wed" },
      severity: "info"
    },
    {
      id: "4",
      type: "shift_removed",
      title: "Shift Cancelled", 
      description: "Removed Julia's Saturday morning shift due to low booking",
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      user: { name: "Mike Assistant", initials: "MA" },
      target: { staff: "Julia Thompson", day: "Saturday", time: "9:00 AM - 1:00 PM" },
      severity: "warning"
    },
    {
      id: "5",
      type: "staff_added",
      title: "New Staff Added",
      description: "Added Alex Johnson as a new stylist to the team",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      user: { name: "Sarah Manager", initials: "SM" },
      target: { staff: "Alex Johnson" },
      severity: "success"
    }
  ]);
  
  // Settings state
  const [appSettings, setAppSettings] = useState<AppSettings>({
    fullTimeSettings: {
      minHoursPerWeek: 32,
      minDaysPerWeek: 4,
      consecutiveHoursThreshold: 6,
      overtimeThreshold: 40,
      enableMinHours: true,
      enableMinDays: true,
      enableConsecutiveHours: true,
      enableOvertime: true
    },
    dashboardCards: {
      showScheduleStats: true,
      showOnboardingTips: true,
      showSalonHours: true,
      showUpcomingTimeOff: true,
      showTeamSummary: true,
      showPerformanceMetrics: false
    }
  });
  
  // Mock current user - change role to "staff" to test staff perspective

  // Apply settings changes  
  // Settings are automatically applied when changed

  const handleSettingsChange = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    // In a real app, save to backend/localStorage
    localStorage.setItem('scheduleAppSettings', JSON.stringify(newSettings));
  };

  const handleMarkAllStaffOff = (date: string, reason: string) => {
    // Mark all staff as off for the specified date
    const updatedSchedule = { ...schedule };

    Object.keys(updatedSchedule).forEach(() => {
      // This is a simplified implementation - in a real app, you'd need to handle date-specific schedules
      // For now, we'll just show a toast confirming the action
    });

    toast({
      title: "All Staff Marked Off",
      description: `All team members have been marked as off on ${date} for ${reason}`,
    });
  };

  const handleFilterChange = (filters: FilterState) => {
    let filtered = mockEmployees;

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Department filter (simplified for demo)
    if (filters.department !== "all") {
      filtered = filtered.filter(emp => {
        // Simple department assignment based on name
        if (filters.department === "salon" && emp.name.toLowerCase().includes("salon")) return true;
        if (filters.department === "spa" && emp.id <= "5") return true;
        if (filters.department === "nails" && emp.id > "5" && emp.id <= "10") return true;
        if (filters.department === "massage" && emp.id > "10") return true;
        return filters.department === "all";
      });
    }

    // Availability filter
    if (filters.availability !== "all") {
      filtered = filtered.filter(emp => {
        const empSchedule = schedule[emp.id] || {};
        const today = "MON"; // Simplified for demo
        const todaySlots = empSchedule[today] || [];
        
        if (filters.availability === "available") {
          return todaySlots.length > 0 && todaySlots[0]?.type !== "off";
        }
        if (filters.availability === "off") {
          return todaySlots.length === 0 || todaySlots[0]?.type === "off";
        }
        return true;
      });
    }

    // Apply staff filter
    if (!selectedStaffIds.includes("all") && selectedStaffIds.length > 0) {
      filtered = filtered.filter(emp => selectedStaffIds.includes(emp.id));
    }

    setFilteredEmployees(filtered);
  };

  const handleTimeOffChipClick = (employeeId: string) => {
    // Open add/edit schedule modal with time off tab
    setInitialStaffId(employeeId);
    setInitialTab("timeoff");
    setInitialDay("MON"); // Default day, will be overridden by date logic if needed
    setAddEditScheduleModalOpen(true);
  };

  const handleSetOffDay = (staffId: string, day: string, reason: string = "Personal") => {
    // Store the original schedule before replacing with off day
    setOriginalSchedules(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [day]: schedule[staffId]?.[day] || []
      }
    }));

    setLocalScheduleOverrides(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [day]: [{ start: "", end: "", type: "off" as const, reason }]
      }
    }));
  };

  const handleRemoveOffDay = (staffId: string, day: string) => {
    // Restore the original schedule if it exists
    let originalDaySchedule = originalSchedules[staffId]?.[day];

    // If no original schedule is stored (e.g., for existing off days in mock data),
    // try to infer a reasonable schedule from other days for this employee
    if (!originalDaySchedule || originalDaySchedule.length === 0) {
      const employeeSchedule = schedule[staffId];
      if (employeeSchedule) {
        // Find a similar weekday schedule to use as template
        const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
        const weekends = ['SAT', 'SUN'];

        const isWeekend = weekends.includes(day);
        const daysToCheck = isWeekend ? weekends : weekdays;

        // Find the first non-off day with a schedule
        for (const otherDay of daysToCheck) {
          const otherDaySchedule = employeeSchedule[otherDay];
          if (otherDaySchedule && otherDaySchedule.length > 0 && otherDaySchedule[0].type !== 'off') {
            originalDaySchedule = otherDaySchedule;
            break;
          }
        }

        // If still no schedule found, try any day
        if (!originalDaySchedule || originalDaySchedule.length === 0) {
          for (const otherDay of Object.keys(employeeSchedule)) {
            const otherDaySchedule = employeeSchedule[otherDay];
            if (otherDaySchedule && otherDaySchedule.length > 0 && otherDaySchedule[0].type !== 'off') {
              originalDaySchedule = otherDaySchedule;
              break;
            }
          }
        }

        // If still nothing, create a default schedule
        if (!originalDaySchedule || originalDaySchedule.length === 0) {
          originalDaySchedule = [{ start: "9a", end: "5p", type: "normal" }];
        }
      }
    }

    // Clear the local override for this day (will fall back to DB/mock data)
    setLocalScheduleOverrides(prev => {
      const newOverrides = { ...prev };
      if (newOverrides[staffId]) {
        const staffOverrides = { ...newOverrides[staffId] };
        delete staffOverrides[day];
        if (Object.keys(staffOverrides).length === 0) {
          delete newOverrides[staffId];
        } else {
          newOverrides[staffId] = staffOverrides;
        }
      }
      return newOverrides;
    });

    // Clean up the stored original schedule
    setOriginalSchedules(prev => {
      const newOriginals = { ...prev };
      if (newOriginals[staffId]) {
        delete newOriginals[staffId][day];
        // If no more originals for this staff, remove the staff entry
        if (Object.keys(newOriginals[staffId]).length === 0) {
          delete newOriginals[staffId];
        }
      }
      return newOriginals;
    });

    const employeeName = mockEmployees.find(emp => emp.id === staffId)?.name || 'Staff member';
    const hasSchedule = originalDaySchedule && originalDaySchedule.length > 0;

    toast({
      title: "Off Day Removed",
      description: hasSchedule
        ? `${employeeName}'s schedule has been restored for ${day}.`
        : `${employeeName} is now available on ${day}.`,
    });
  };

  const handleStaffChange = (staffIds: string[]) => {
    setSelectedStaffIds(staffIds);
    // Reapply current filters with new staff selection
    const currentFilters: FilterState = { 
      searchTerm: "", 
      department: "all", 
      availability: "all", 
      shiftType: "all",
      position: "all"
    };
    handleFilterChange(currentFilters);
  };

  // Apply staff filter when selectedStaffIds changes
  useEffect(() => {
    if (!selectedStaffIds.includes("all") && selectedStaffIds.length > 0) {
      setFilteredEmployees(mockEmployees.filter(emp => selectedStaffIds.includes(emp.id)));
    } else {
      setFilteredEmployees(mockEmployees);
    }
  }, [selectedStaffIds]);

  return (
    <div className="flex-1 bg-background min-h-screen">
      {/* Mobile-First Navigation Header */}
      <div className="sticky top-0 lg:top-16 z-30 bg-card/95 glass-effect border-b border-border/50">
        <div className="p-4 lg:p-6">
          <div className="space-y-4">
            {/* Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Schedule</h1>
                <p className="text-sm text-muted-foreground">Manage your team's schedule</p>
              </div>
              
              {/* Action Buttons - Mobile optimized */}
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="apple-transition bg-primary text-primary-foreground hover:bg-primary/90 apple-shadow-sm rounded-xl focus:ring-2 focus:ring-primary focus:ring-offset-2 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 text-xs sm:text-sm md:text-base"
                        onClick={() => {
                          setAddEditScheduleModalOpen(true);
                          setInitialStaffId(undefined);
                          setInitialTab("regular");
                        }}
                        aria-label="Add new schedule for staff member"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2" />
                        Add Schedule
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="apple-shadow-md">
                      <p>Create a new schedule entry for any staff member</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="apple-transition bg-warning/10 text-warning border-warning/30 hover:bg-warning/20 apple-shadow-sm rounded-xl px-3 py-2 text-xs sm:text-sm relative focus:ring-2 focus:ring-warning focus:ring-offset-2"
                        onClick={() => setTimeOffModalOpen(true)}
                        aria-label="Manage time off requests (1 pending)"
                      >
                        <CalendarX className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Time Off
                        <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground min-w-[18px] h-[18px] rounded-full p-0 flex items-center justify-center text-[10px] font-semibold">
                          1
                        </Badge>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="apple-shadow-md">
                      <p>Review and manage time off requests (1 pending approval)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="apple-transition rounded-xl p-2 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="More schedule options and settings"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 apple-shadow-lg rounded-2xl bg-background border border-border/50">
                    <DropdownMenuItem 
                      className="apple-transition rounded-xl m-1 focus:bg-accent focus:text-accent-foreground cursor-pointer"
                      onClick={() => {
                        setSettingsModalOpen(true);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings & Preferences
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="apple-transition rounded-xl m-1 focus:bg-accent focus:text-accent-foreground cursor-pointer"
                      onClick={() => setActivityFeedOpen(true)}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Activity Logs
                    </DropdownMenuItem>
                    
                    <div className="px-3 py-2 border-b border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Shift Legend</span>
                      </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary rounded-full apple-shadow-sm"></div>
                            <span className="text-muted-foreground">Full Day Scheduled</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-light-blue rounded-full apple-shadow-sm"></div>
                            <span className="text-muted-foreground">Partial Day Scheduled</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-muted rounded-full border border-muted-foreground/20"></div>
                            <span className="text-muted-foreground">Not Scheduled</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-destructive rounded-full apple-shadow-sm"></div>
                            <span className="text-muted-foreground">Time Off</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500 rounded-full apple-shadow-sm flex items-center justify-center">
                              <Zap className="w-2 h-2 text-white" />
                            </div>
                            <span className="text-muted-foreground">Extra Shift</span>
                          </div>
                        </div>
                      </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent className="apple-shadow-md">
                    <p>Access schedule settings, activity logs, and shift legend</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              </div>
            </div>

            {/* Tab Navigation - Mobile responsive */}
            <div className="overflow-x-auto">
              <div className="flex gap-1 bg-muted/50 rounded-2xl p-1 w-fit min-w-full sm:min-w-0">
                <Button
                  variant="ghost"
                  className="flex-1 sm:flex-initial px-4 py-2 bg-card text-foreground font-medium apple-shadow-sm rounded-xl apple-transition text-sm"
                >
                  Regular Shifts
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 sm:flex-initial px-4 py-2 text-muted-foreground font-medium apple-transition hover:text-foreground text-sm"
                  onClick={() => toast({ title: "Coming Soon", description: "Schedule Planning feature is coming soon!" })}
                >
                  Schedule Planning
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - Mobile optimized */}
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Conditional Dashboard Cards based on settings */}
        {appSettings.dashboardCards.showOnboardingTips && <OnboardingTips />}
        
        {appSettings.dashboardCards.showSalonHours && <SalonHoursBar onMarkAllStaffOff={handleMarkAllStaffOff} />}
        
        {/* Statistics - Mobile responsive grid */}
        {appSettings.dashboardCards.showScheduleStats && (
          <ScheduleStats
            employees={filteredEmployees} 
            schedule={schedule} 
            fullTimeSettings={appSettings.fullTimeSettings}
          />
        )}
        
        {/* Section Header and Filters - Mobile optimized */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Team Schedule</h2>
            <p className="text-sm text-muted-foreground">
              {filteredEmployees.length} staff member{filteredEmployees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 h-9">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={compactView ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCompactView(!compactView)}
                    className="flex items-center justify-center w-9 h-9 p-0"
                  >
                    {compactView ? <Rows className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{compactView ? "Switch to standard view" : "Switch to compact view (up to 40 rows)"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ScheduleFilters onFilterChange={handleFilterChange} />
          </div>
        </div>
        
        {/* Schedule Table Container with Horizontal and Vertical Scrolling */}
        <div className="bg-card apple-shadow-md rounded-2xl overflow-hidden border border-border/50">
          {/* Combined Scroll Container - Both header and rows scroll together horizontally */}
          <div className="relative overflow-auto max-h-[calc(100vh-350px)] scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/30">
            {/* Sticky Schedule Header - scrolls horizontally with content */}
            <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border/50">
              <ScheduleHeader 
                employees={mockEmployees}
                selectedStaffIds={selectedStaffIds}
                onStaffChange={handleStaffChange}
                compactView={compactView}
              />
            </div>
            
            {/* Employee Rows */}
            <div className="divide-y divide-border/50">
              {filteredEmployees.map((employee) => (
                  <EmployeeRow
                    key={employee.id}
                    employee={employee}
                    schedule={schedule[employee.id] || {}}
                    futureTimeOff={mockFutureTimeOff}
                    onTimeOffChipClick={handleTimeOffChipClick}
                    onEditSchedule={(staffId, tab, day) => {
                      setInitialStaffId(staffId);
                      setInitialTab(tab || "regular");
                      setInitialDay(day || "MON");
                      setAddEditScheduleModalOpen(true);
                    }}
                    onSetOffDay={handleSetOffDay}
                    onRemoveOffDay={handleRemoveOffDay}
                    compactView={compactView}
                    fullTimeSettings={appSettings.fullTimeSettings}
                  />
                ))}
            </div>
          </div>
          
          {filteredEmployees.length === 0 && (
            <div className="p-6 sm:p-8 lg:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No staff members found</h3>
              <p className="text-sm text-muted-foreground max-w-xs sm:max-w-sm mx-auto">
                Try adjusting your search criteria or filters to find team members.
              </p>
            </div>
          )}
        </div>
      </div>

      <TimeOffModal
        isOpen={timeOffModalOpen}
        onClose={() => setTimeOffModalOpen(false)}
      />
      
      <AddEditScheduleModal
        open={addEditScheduleModalOpen}
        onOpenChange={setAddEditScheduleModalOpen}
        staffList={mockEmployees}
        initialStaffId={initialStaffId}
        initialTab={initialTab}
        initialDay={initialDay}
        existingSchedules={schedule}
        existingTimeOff={mockFutureTimeOff.map(request => ({
          id: request.id,
          employeeId: request.employeeId,
          employeeName: mockEmployees.find(emp => emp.id === request.employeeId)?.name || "Unknown",
          date: request.date,
          reason: request.reason,
          isPaid: true,
          status: "approved" as const,
          submittedAt: new Date().toISOString()
        }))}
        onSave={(data: ScheduleData) => {
          console.log("Saving schedule data:", data);
          // In a real app, this would save to the backend
        }}
        onTimeOffUpdate={(timeOff: TimeOffRequest[]) => {
          console.log("Updating time off:", timeOff);
          // In a real app, this would update the time off data
        }}
      />
      
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        settings={appSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Activity Feed */}
      <ActivityFeed
        open={activityFeedOpen}
        onOpenChange={setActivityFeedOpen}
        activities={activities}
      />
    </div>
  );
}