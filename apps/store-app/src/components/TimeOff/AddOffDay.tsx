import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Check, ChevronsUpDown, CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TimeOffRequest } from "./types";
import { TimePicker } from "@/components/schedule/TimePicker";

const mockStaff = [
  { id: "emp1", name: "John Smith" },
  { id: "emp2", name: "Sarah Johnson" },
  { id: "emp3", name: "Mike Chen" },
  { id: "emp4", name: "Emily Davis" },
];

interface AddOffDayProps {
  onSubmit: (request: Omit<TimeOffRequest, "id" | "submittedAt">) => void;
  currentUser?: {
    id: string;
    name: string;
    role: "manager" | "staff";
  };
  isManager: boolean;
}

export function AddOffDay({ onSubmit, currentUser, isManager }: AddOffDayProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isDateRange, setIsDateRange] = useState(false);
  const [shiftType, setShiftType] = useState<"full" | "partial">("full");
  const [startTime, setStartTime] = useState<string>("9:00a");
  const [endTime, setEndTime] = useState<string>("5:00p");
  const [reason, setReason] = useState("");
  const [payrollImpact, setPayrollImpact] = useState(true);

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.match(/^(\d{1,2}:\d{2})(a|p)$/)?.slice(1) || [];
    if (!time || !period) return 0;
    
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'p' && hours !== 12) hours += 12;
    if (period === 'a' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
  };

  // Calculate time off duration
  const getTimeOffSummary = () => {
    if (shiftType !== "partial") return null;
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) return null;
    
    const timeOffMinutes = endMinutes - startMinutes;
    const timeOffHours = Math.floor(timeOffMinutes / 60);
    const timeOffMins = timeOffMinutes % 60;
    
    return {
      timeOffHours,
      timeOffMins,
      totalMinutes: timeOffMinutes
    };
  };

  const handleSubmit = () => {
    if (!startDate || (!isManager && !currentUser)) return;

    const staffId = isManager ? selectedStaff : currentUser!.id;
    const staffName = isManager 
      ? mockStaff.find(emp => emp.id === selectedStaff)?.name || ""
      : currentUser!.name;

    onSubmit({
      staffId,
      staffName,
      date: format(startDate, "yyyy-MM-dd"),
      endDate: isDateRange && endDate ? format(endDate, "yyyy-MM-dd") : null,
      shiftType,
      reason: reason.trim() || undefined,
      status: isManager ? "approved" : "pending",
      payrollImpact,
      submittedBy: currentUser?.id || staffId
    });

    // Reset form
    setSelectedStaff("");
    setStaffDropdownOpen(false);
    setStartDate(undefined);
    setEndDate(undefined);
    setIsDateRange(false);
    setShiftType("full");
    setStartTime("9:00a");
    setEndTime("5:00p");
    setReason("");
    setPayrollImpact(true);
  };

  const canSubmit = startDate && (isManager ? selectedStaff : true) && (!isDateRange || endDate);

  return (
    <div className="space-y-6">
      {isManager && (
        <div className="space-y-2">
          <Label>Staff Member</Label>
          <Popover open={staffDropdownOpen} onOpenChange={setStaffDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={staffDropdownOpen}
                className="w-full justify-between"
              >
                {selectedStaff
                  ? mockStaff.find((staff) => staff.id === selectedStaff)?.name
                  : "Select staff member..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search staff members..." />
                <CommandList>
                  <CommandEmpty>No staff member found.</CommandEmpty>
                  <CommandGroup>
                    {mockStaff.map((staff) => (
                      <CommandItem
                        key={staff.id}
                        value={staff.name}
                        onSelect={() => {
                          setSelectedStaff(staff.id === selectedStaff ? "" : staff.id);
                          setStaffDropdownOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedStaff === staff.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {staff.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStartDate(new Date())}
                      className="text-xs"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setStartDate(tomorrow);
                      }}
                      className="text-xs"
                    >
                      Tomorrow
                    </Button>
                  </div>
                </div>
                {isDateRange ? (
                  <Calendar
                    mode="range"
                    selected={startDate && endDate ? { from: startDate, to: endDate } : startDate ? { from: startDate, to: undefined } : undefined}
                    onSelect={(selected) => {
                      if (selected?.from) {
                        setStartDate(selected.from);
                        if (selected.to) {
                          setEndDate(selected.to);
                        } else {
                          setEndDate(undefined);
                        }
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                ) : (
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="date-range"
            checked={isDateRange}
            onCheckedChange={(checked) => {
              setIsDateRange(checked);
              if (!checked) {
                setEndDate(undefined);
              }
            }}
          />
          <Label htmlFor="date-range">Date Range</Label>
        </div>

        {isDateRange && (
          <div className="space-y-2">
            <Label>End Date</Label>
            <div className="text-sm text-muted-foreground mb-2">
              {startDate && endDate 
                ? `Selected range: ${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
                : startDate 
                  ? "Click on the calendar above to select end date or drag to select range"
                  : "Please select start date first"}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Shift Type</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={shiftType === "full" ? "default" : "outline"}
            onClick={() => setShiftType("full")}
            className="flex-1"
          >
            Full Day Off
          </Button>
          <Button
            type="button"
            variant={shiftType === "partial" ? "default" : "outline"}
            onClick={() => setShiftType("partial")}
            className="flex-1"
          >
            Partial Day Off
          </Button>
        </div>
      </div>

      {shiftType === "partial" && (
        <div className="space-y-3 p-3 bg-muted/30 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Partial Day Off Details</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Time</Label>
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                placeholder="Select start time"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Time</Label>
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                placeholder="Select end time"
                minTime={startTime}
              />
            </div>
          </div>

          {(() => {
            const summary = getTimeOffSummary();
            return summary ? (
              <div className="mt-3 p-2 bg-background border rounded-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Time off duration:</span>
                  <span className="font-medium text-destructive">
                    {summary.timeOffHours}h {summary.timeOffMins > 0 ? `${summary.timeOffMins}m` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Remaining work hours:</span>
                  <span className="font-medium text-primary">
                    {Math.max(0, 8 - summary.timeOffHours)}h {summary.timeOffMins > 0 ? `${60 - summary.timeOffMins}m` : ''}
                  </span>
                </div>
              </div>
            ) : endTime && timeToMinutes(endTime) <= timeToMinutes(startTime) ? (
              <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-xs text-destructive">End time must be after start time</p>
              </div>
            ) : null;
          })()}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">Reason (Optional)</Label>
        <Textarea
          id="reason"
          placeholder="Enter reason for time off..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="payroll-impact">Payroll Impact</Label>
          <p className="text-sm text-muted-foreground">
            Enable this to mark the time off as payroll impacting. The actual payroll adjustment depends on your organization's compensation policy
          </p>
        </div>
        <Switch
          id="payroll-impact"
          checked={payrollImpact}
          onCheckedChange={setPayrollImpact}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1"
        >
          {isManager ? "Save" : "Submit Request"}
        </Button>
      </div>
    </div>
  );
}