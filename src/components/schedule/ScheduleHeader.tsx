import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Utility function to generate display names with nickname conflict resolution
const getDisplayName = (employees: { id: string; name: string; nickname: string; position: string; duration: string; avatar: string; initials: string; }[]) => {
  const nicknameMap = new Map<string, { id: string; name: string; nickname: string; }[]>();
  
  // Group employees by nickname
  employees.forEach(emp => {
    const nickname = emp.nickname;
    if (!nicknameMap.has(nickname)) {
      nicknameMap.set(nickname, []);
    }
    nicknameMap.get(nickname)!.push({ id: emp.id, name: emp.name, nickname: emp.nickname });
  });
  
  // Create display name map
  const displayNameMap = new Map<string, string>();
  
  nicknameMap.forEach((employeesWithNickname, nickname) => {
    if (employeesWithNickname.length === 1) {
      // No conflict - use nickname only
      displayNameMap.set(employeesWithNickname[0].id, nickname);
    } else {
      // Conflict - append first letter of last name
      employeesWithNickname.forEach(emp => {
        const lastName = emp.name.split(' ').pop() || '';
        const lastNameInitial = lastName.charAt(0).toUpperCase();
        displayNameMap.set(emp.id, `${nickname} ${lastNameInitial}.`);
      });
    }
  });
  
  return displayNameMap;
};

const days = [
  { short: "MON", full: "Monday" },
  { short: "TUE", full: "Tuesday" },
  { short: "WED", full: "Wednesday" },
  { short: "THU", full: "Thursday" },
  { short: "FRI", full: "Friday" },
  { short: "SAT", full: "Saturday" },
  { short: "SUN", full: "Sunday" },
];

interface Employee {
  id: string;
  name: string;
  nickname: string;
  position: string;
  duration: string;
  avatar: string;
  initials: string;
}

interface ScheduleHeaderProps {
  employees: Employee[];
  selectedStaffIds: string[];
  onStaffChange: (staffIds: string[]) => void;
  compactView?: boolean;
}

export function ScheduleHeader({ employees, selectedStaffIds, onStaffChange, compactView = false }: ScheduleHeaderProps) {
  const [open, setOpen] = useState(false);
  
  // Get display names with conflict resolution
  const displayNameMap = getDisplayName(employees);
  
  // Create staff options with "All Staff" as first option
  const staffOptions = [
    { id: "all", name: "All Staff" },
    ...(employees || []).map(emp => ({ id: emp.id, name: displayNameMap.get(emp.id) || emp.nickname }))
  ];
  
  // Handle display text for multiple selections
  const getDisplayText = () => {
    if (selectedStaffIds.includes("all") || selectedStaffIds.length === 0) {
      return "All Staff";
    }
    if (selectedStaffIds.length === 1) {
      return staffOptions.find(s => s.id === selectedStaffIds[0])?.name || "Staff";
    }
    return `${selectedStaffIds.length} Staff Selected`;
  };

  const handleStaffToggle = (staffId: string) => {
    if (staffId === "all") {
      // If "All Staff" is selected, clear all other selections
      onStaffChange(["all"]);
    } else {
      const newSelection = selectedStaffIds.includes(staffId)
        ? selectedStaffIds.filter(id => id !== staffId && id !== "all") // Remove if selected, also remove "all"
        : [...selectedStaffIds.filter(id => id !== "all"), staffId]; // Add if not selected, remove "all"
      
      // If no individual staff selected, default to "all"
      onStaffChange(newSelection.length === 0 ? ["all"] : newSelection);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStaffChange(["all"]);
  };

  const displayText = getDisplayText();
  const showReset = !selectedStaffIds.includes("all") && selectedStaffIds.length > 0;

  return (
    <div className="bg-muted/30 border-b border-border/50 relative">
      {/* Mobile-optimized flexible layout */}
      <div className={`flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-fit ${compactView ? 'p-2 sm:p-2.5 lg:p-3' : 'p-2.5 sm:p-3 lg:p-6'}`}>
        {/* Staff column - Optimized width to match EmployeeRow for alignment */}
        <div className={`sticky left-0 z-30 bg-card shadow-sm sm:shadow-md border-r border-border/30 flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0 -ml-2.5 sm:-ml-3 lg:-ml-6 pl-2.5 sm:pl-3 lg:pl-6 pr-1.5 sm:pr-2 lg:pr-3 ${
          compactView 
            ? 'w-24 sm:w-28 md:w-32 lg:w-36' 
            : 'w-28 sm:w-32 md:w-36 lg:w-40'
        }`}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className={`font-medium text-muted-foreground apple-transition hover:text-foreground w-full justify-between ${compactView ? 'text-[10px] lg:text-xs' : 'text-xs lg:text-sm'}`}>
                <span className="hidden lg:inline truncate">{displayText}</span>
                <span className="lg:hidden truncate">{displayText === "All Staff" ? "Staff" : displayText.includes("Selected") ? `${selectedStaffIds.length}` : displayText.split(" ")[0]}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {showReset && (
                    <X 
                      className={`hover:text-destructive transition-colors ${compactView ? 'w-3 h-3' : 'w-3 h-3 lg:w-4 lg:h-4'}`}
                      onClick={handleReset}
                    />
                  )}
                  <ChevronDown className={compactView ? 'w-3 h-3' : 'w-3 h-3 lg:w-4 lg:h-4'} />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 max-h-[60vh] overflow-hidden" align="start">
              <Command>
                <CommandInput placeholder="Search staff..." className="h-9 flex-shrink-0" />
                <CommandList className="overflow-y-auto max-h-[50vh]">
                  <CommandEmpty>No staff found.</CommandEmpty>
                  <CommandGroup>
                    {staffOptions.map((member) => (
                      <CommandItem
                        key={member.id}
                        value={member.name}
                        onSelect={() => {
                          handleStaffToggle(member.id);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          checked={selectedStaffIds.includes(member.id)}
                          className="h-4 w-4"
                        />
                        {member.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Day columns - Flex layout for better mobile handling */}
        <div className={`flex flex-1 ${
          compactView 
            ? 'gap-1.5 sm:gap-2 md:gap-3 lg:gap-4' 
            : 'gap-2 sm:gap-2.5 md:gap-3 lg:gap-4'
        }`}>
          {days.map((day) => (
            <div key={day.short} className={`text-center flex-1 ${
              compactView 
                ? 'min-w-[60px] sm:min-w-[70px] md:min-w-[85px] lg:min-w-[100px]' 
                : 'min-w-[70px] sm:min-w-[85px] md:min-w-[100px] lg:min-w-[120px]'
            }`}>
              <div className={`font-semibold text-foreground tracking-wide ${compactView ? 'text-[10px] lg:text-xs' : 'text-xs lg:text-sm'}`}>{day.short}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}