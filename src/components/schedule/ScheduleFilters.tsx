import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Filter, Users, Clock, AlertCircle, X } from "lucide-react";
interface ScheduleFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}
export interface FilterState {
  searchTerm: string;
  department: string;
  availability: string;
  shiftType: string;
  position: string;
}
export function ScheduleFilters({
  onFilterChange
}: ScheduleFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    department: "all",
    availability: "all",
    shiftType: "all",
    position: "all"
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters
    };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);

    // Count active filters
    const count = Object.values(updatedFilters).filter(value => value !== "" && value !== "all").length;
    setActiveFiltersCount(count);
  };
  const clearFilters = () => {
    const clearedFilters = {
      searchTerm: "",
      department: "all",
      availability: "all",
      shiftType: "all",
      position: "all"
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setActiveFiltersCount(0);
  };
  return <div className="sticky top-20 lg:top-24 z-20 bg-background/95 backdrop-blur-sm border-b border-border/30 pb-4 mb-4">
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative apple-transition hover:scale-105 apple-shadow-md rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 font-semibold mt-1"
          aria-label={`Filters ${activeFiltersCount > 0 ? `(${activeFiltersCount} active)` : ''}`}
        >
          <Filter className="w-4 h-4" />
          {activeFiltersCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs apple-shadow-sm">
              {activeFiltersCount}
            </Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 sm:w-80 p-0 apple-shadow-lg rounded-2xl border-border/50 max-h-[80vh] overflow-hidden flex flex-col" align="end">
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <Filter className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Filters</span>
            </div>
            {activeFiltersCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 px-3 apple-transition hover:bg-destructive/10 hover:text-destructive rounded-lg">
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>}
          </div>

          <div className="space-y-4">
            {/* Search Input */}
            

            {/* Department Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Department</label>
              <Select value={filters.department} onValueChange={value => updateFilters({
              department: value
            })}>
                <SelectTrigger className="rounded-xl border-border/50 apple-transition">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Departments" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl apple-shadow-lg">
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="salon">Salon</SelectItem>
                  <SelectItem value="spa">Spa</SelectItem>
                  <SelectItem value="nails">Nails</SelectItem>
                  <SelectItem value="massage">Massage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Availability</label>
              <Select value={filters.availability} onValueChange={value => updateFilters({
              availability: value
            })}>
                <SelectTrigger className="rounded-xl border-border/50 apple-transition">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Staff" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl apple-shadow-lg">
                  <SelectItem value="all">All Staff</SelectItem>
                  <SelectItem value="available">Available Today</SelectItem>
                  <SelectItem value="off">Off Today</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shift Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Shift Type</label>
              <Select value={filters.shiftType} onValueChange={value => updateFilters({
              shiftType: value
            })}>
                <SelectTrigger className="rounded-xl border-border/50 apple-transition">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Shifts" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl apple-shadow-lg">
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="extra">Extra Shifts</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Position Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Position</label>
              <Select value={filters.position} onValueChange={value => updateFilters({
              position: value
            })}>
                <SelectTrigger className="rounded-xl border-border/50 apple-transition">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Positions" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl apple-shadow-lg">
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="stylist">Stylist</SelectItem>
                  <SelectItem value="colorist">Colorist</SelectItem>
                  <SelectItem value="aesthetician">Aesthetician</SelectItem>
                  <SelectItem value="massage-therapist">Massage Therapist</SelectItem>
                  <SelectItem value="nail-technician">Nail Technician</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>;
}