import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, Users, UserX, BarChart3 } from "lucide-react";
import type { FullTimeSettings } from "./SettingsModal";

interface ScheduleStatsProps {
  employees: any[];
  schedule: any;
  fullTimeSettings?: FullTimeSettings;
}

export function ScheduleStats({ employees, schedule, fullTimeSettings }: ScheduleStatsProps) {
  const calculateStats = () => {
    let totalHours = 0;
    let offToday = 0;
    let activeStaff = 0;

    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    
    employees.forEach(employee => {
      const empSchedule = schedule[employee.id] || {};
      let hasShifts = false;
      let isOffToday = false;
      
      days.forEach(day => {
        const daySlots = empSchedule[day] || [];
        
        if (daySlots.length > 0 && daySlots[0]?.type !== "off") {
          hasShifts = true;
          
          daySlots.forEach(slot => {
            if (slot.start && slot.end && slot.type !== "off") {
              // Simple hour calculation
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
              totalHours += duration;
            }
          });
        } else if (daySlots.length === 0 || daySlots[0]?.type === "off") {
          isOffToday = true;
        }
      });
      
      if (hasShifts) activeStaff++;
      if (isOffToday) offToday++;
    });

    // Calculate capacity sold percentage (assuming full capacity is all employees working)
    const maxCapacity = employees.length * 7; // Max possible staff-days per week
    const currentCapacity = employees.reduce((total, emp) => {
      const empSchedule = schedule[emp.id] || {};
      let workingDays = 0;
      days.forEach(day => {
        const daySlots = empSchedule[day] || [];
        if (daySlots.length > 0 && daySlots[0]?.type !== "off") {
          workingDays++;
        }
      });
      return total + workingDays;
    }, 0);
    
    const capacitySold = maxCapacity > 0 ? Math.round((currentCapacity / maxCapacity) * 100) : 0;

    return {
      totalHours: Math.round(totalHours),
      activeStaff,
      offToday,
      capacitySold
    };
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Hours Card */}
      <Card className="p-4 sm:p-6 apple-shadow-md rounded-2xl border-border/50 bg-gradient-card hover:apple-shadow-lg apple-transition">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{stats.totalHours}</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Hours This Week</p>
          </div>
        </div>
      </Card>
      
      {/* Active Staff Card */}
      <Card className="p-4 sm:p-6 apple-shadow-md rounded-2xl border-border/50 bg-gradient-card hover:apple-shadow-lg apple-transition">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{stats.activeStaff}</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Working Today</p>
          </div>
        </div>
      </Card>
      
      {/* Extra Shifts Card */}
      <Card className="p-4 sm:p-6 apple-shadow-md rounded-2xl border-border/50 bg-gradient-card hover:apple-shadow-lg apple-transition">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{stats.offToday}</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Off Today</p>
          </div>
        </div>
      </Card>
      
      {/* Capacity Sold % Card */}
      <Card className="p-4 sm:p-6 apple-shadow-md rounded-2xl border-border/50 bg-gradient-card hover:apple-shadow-lg apple-transition">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {stats.capacitySold}%
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Capacity Sold %</p>
          </div>
        </div>
      </Card>
    </div>
  );
}