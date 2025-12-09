import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Search, Check, Plus, ChevronUp, ChevronDown, ArrowUpAZ, ArrowDownAZ, Filter, GripVertical, Pencil, Save, X } from "lucide-react";
import Tippy from "@tippyjs/react";
import { Reorder } from "framer-motion";
import { StaffMember, TicketService } from "./ServiceList";
import { SPECIALTY_COLORS, SpecialtyColors } from "@/components/StaffCard/constants/staffCardTokens";

interface StaffGridViewProps {
  staffMembers: StaffMember[];
  services: TicketService[];
  onAddServiceToStaff: (staffId: string, staffName: string) => void;
  reassigningServiceIds?: string[];
  selectedStaffId?: string | null;
}

type ViewMode = 'normal' | 'compact';
type SortMode = 'a-z' | 'z-a' | 'custom';
type FilterOption = 'clocked-in' | 'ready' | 'busy' | 'off' | 'on-ticket';

// Filter configuration with labels and colors
const FILTER_CONFIG: Record<FilterOption, { label: string; color: string; dotColor: string }> = {
  'clocked-in': { label: 'Clocked In', color: 'bg-blue-100 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  'ready': { label: 'Ready', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  'busy': { label: 'Busy', color: 'bg-rose-100 text-rose-700 border-rose-200', dotColor: 'bg-rose-500' },
  'off': { label: 'Clocked Out', color: 'bg-gray-100 text-gray-700 border-gray-200', dotColor: 'bg-gray-400' },
  'on-ticket': { label: 'On This Ticket', color: 'bg-purple-100 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' },
};

const STAFF_GRID_VIEW_MODE_KEY = 'mango-staff-grid-view-mode';
const STAFF_GRID_SORT_KEY = 'mango-staff-grid-sort';
const STAFF_GRID_FILTERS_KEY = 'mango-staff-grid-filters';
const STAFF_GRID_CUSTOM_ORDER_KEY = 'mango-staff-grid-custom-order';

// Draggable Staff Card Component
interface StaffCardProps {
  staff: StaffMember;
  viewMode: ViewMode;
  services: TicketService[];
  selectedStaffId?: string | null;
  onAddServiceToStaff: (staffId: string, staffName: string) => void;
  getStaffInitials: (name: string) => string;
  getStaffServiceCount: (staffId: string) => number;
  getStaffServiceTotal: (staffId: string) => number;
  getSpecialtyColors: (staff: StaffMember) => SpecialtyColors;
  isArrangeMode?: boolean; // When true, click is disabled, only drag works
}

function StaffCard({
  staff,
  viewMode,
  selectedStaffId,
  onAddServiceToStaff,
  getStaffInitials,
  getStaffServiceCount,
  getStaffServiceTotal,
  getSpecialtyColors,
  isArrangeMode = false,
}: StaffCardProps) {
  const serviceCount = getStaffServiceCount(staff.id);
  const serviceTotal = getStaffServiceTotal(staff.id);
  const hasServices = serviceCount > 0;
  const isActive = selectedStaffId === staff.id;
  const isOnTicket = hasServices && !isActive;
  const specialty = getSpecialtyColors(staff);

  const cardContent = (
    <div
      className={`relative flex flex-col items-center overflow-hidden transition-all duration-300 ${
        isActive ? '' : 'hover:-translate-y-1 hover:shadow-xl'
      } ${viewMode === 'compact' ? 'rounded-xl' : 'rounded-2xl'}`}
      style={{
        height: viewMode === 'compact' ? '120px' : '200px',
        background: `linear-gradient(to bottom right, ${specialty.bgGradientFrom}, ${specialty.bgGradientTo})`,
        boxShadow: isActive
          ? `0 0 0 3px #10B981, 0 25px 50px -12px rgba(16, 185, 129, 0.3), 0 12px 24px -8px rgba(0, 0, 0, 0.15)`
          : isOnTicket
            ? `0 0 0 2px ${specialty.darkBorderColor}, 0 15px 35px -8px rgba(0, 0, 0, 0.15), 0 8px 16px -6px rgba(0, 0, 0, 0.1)`
            : '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.04)',
        border: `2px solid ${specialty.borderColor}`,
      }}
    >
      {/* Drag handle indicator for arrange mode */}
      {isArrangeMode && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 opacity-60">
          <GripVertical size={16} className="text-amber-600" />
        </div>
      )}

      {/* ACTIVE STATE: Green checkmark badge */}
      {isActive && (
        <>
          <div
            className={`absolute z-10 flex items-center justify-center animate-in fade-in zoom-in duration-200 ${
              viewMode === 'compact' ? 'top-1.5 right-1.5' : 'top-2.5 right-2.5'
            }`}
            style={{
              width: viewMode === 'compact' ? '20px' : '26px',
              height: viewMode === 'compact' ? '20px' : '26px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              border: '2px solid #fff',
            }}
          >
            <Plus className={viewMode === 'compact' ? 'w-2.5 h-2.5 text-white' : 'w-3.5 h-3.5 text-white'} strokeWidth={3} />
          </div>
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ boxShadow: 'inset 0 0 30px rgba(16, 185, 129, 0.15)' }}
          />
        </>
      )}

      {/* ON TICKET STATE: Small service count badge */}
      {isOnTicket && (
        <div
          className={`absolute z-10 flex items-center justify-center ${
            viewMode === 'compact' ? 'top-1.5 left-1.5' : 'top-2.5 left-2.5'
          }`}
          style={{
            minWidth: viewMode === 'compact' ? '18px' : '24px',
            height: viewMode === 'compact' ? '18px' : '24px',
            padding: viewMode === 'compact' ? '0 4px' : '0 6px',
            borderRadius: '12px',
            background: specialty.base,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            border: '2px solid #fff',
          }}
        >
          <Check className={viewMode === 'compact' ? 'w-2 h-2 text-white' : 'w-3 h-3 text-white'} strokeWidth={3} />
        </div>
      )}

      {/* Avatar Section */}
      <div className={`flex-1 flex flex-col items-center justify-center ${
        viewMode === 'compact' ? 'pt-3 pb-1' : 'pt-6 pb-2'
      }`}>
        <div
          className={`rounded-full flex items-center justify-center transition-all duration-300 ${
            isActive ? 'scale-110' : 'group-hover:scale-105'
          } ${viewMode === 'compact' ? 'mb-1.5' : 'mb-3'}`}
          style={{
            width: viewMode === 'compact' ? '50px' : '80px',
            height: viewMode === 'compact' ? '50px' : '80px',
            background: staff.specialty === 'neutral' || !staff.specialty
              ? 'linear-gradient(to bottom right, #FFFFFF, #F8FAFC)'
              : specialty.base,
            border: isActive
              ? `${viewMode === 'compact' ? '3px' : '4px'} solid #10B981`
              : `${viewMode === 'compact' ? '3px' : '4px'} solid white`,
            boxShadow: isActive
              ? `0 8px 24px -6px rgba(16, 185, 129, 0.3)`
              : '0 12px 28px -8px rgba(0,0,0,0.25)',
          }}
        >
          <span
            className="font-black tracking-widest uppercase"
            style={{
              fontSize: viewMode === 'compact' ? '14px' : '22px',
              color: staff.specialty === 'neutral' || !staff.specialty
                ? specialty.textColor
                : '#FFFFFF',
              textShadow: staff.specialty === 'neutral' || !staff.specialty
                ? '0 1px 2px rgba(255,255,255,0.5)'
                : '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {getStaffInitials(staff.name)}
          </span>
        </div>

        <h3
          className={`font-black tracking-widest uppercase truncate w-full text-center px-2 ${
            viewMode === 'compact' ? 'text-xs' : 'text-sm'
          }`}
          style={{
            color: specialty.textColor,
            textShadow: '0 1px 2px rgba(255,255,255,0.5)',
          }}
        >
          {staff.name.split(' ')[0]}
        </h3>
      </div>

      {/* Bottom Section */}
      <div
        className={`w-full text-center ${viewMode === 'compact' ? 'px-1.5 py-1' : 'px-3 py-3'}`}
        style={{
          background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          borderTop: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.3)',
        }}
      >
        {viewMode === 'compact' ? (
          isActive ? (
            <span className="text-[10px] font-bold text-emerald-600">+ ADD</span>
          ) : hasServices ? (
            <div className="flex items-center justify-center gap-1">
              <span className="text-[10px] font-bold" style={{ color: specialty.iconColor }}>{serviceCount}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] font-bold" style={{ color: specialty.textColor }}>${serviceTotal.toFixed(0)}</span>
            </div>
          ) : (
            <span className="text-[10px] font-medium" style={{ color: specialty.iconColor }}>Tap</span>
          )
        ) : (
          isActive ? (
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Adding Services</span>
          ) : hasServices ? (
            <div className="flex items-center justify-center gap-2">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${specialty.base}20`, color: specialty.iconColor }}
              >
                {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
              </span>
              <span className="text-sm font-bold" style={{ color: specialty.textColor }}>${serviceTotal.toFixed(0)}</span>
            </div>
          ) : (
            <span className="text-xs font-medium" style={{ color: specialty.iconColor }}>Tap to add services</span>
          )
        )}
      </div>
    </div>
  );

  // Arrange mode: Draggable, NO click
  if (isArrangeMode) {
    return (
      <Reorder.Item
        value={staff}
        key={staff.id}
        className="group cursor-grab active:cursor-grabbing transition-all duration-300"
        data-testid={`card-staff-grid-${staff.id}`}
        whileDrag={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
      >
        {cardContent}
      </Reorder.Item>
    );
  }

  // Normal mode: Clickable, no drag
  return (
    <div
      className={`group cursor-pointer transition-all duration-300 ${
        isActive ? 'scale-105 -translate-y-1' : ''
      }`}
      onClick={() => onAddServiceToStaff(staff.id, staff.name)}
      data-testid={`card-staff-grid-${staff.id}`}
    >
      {cardContent}
    </div>
  );
}

export default function StaffGridView({
  staffMembers,
  services,
  onAddServiceToStaff,
  reassigningServiceIds = [],
  selectedStaffId,
}: StaffGridViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STAFF_GRID_VIEW_MODE_KEY);
    return (saved === 'compact' || saved === 'normal') ? saved : 'normal';
  });
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    const saved = localStorage.getItem(STAFF_GRID_SORT_KEY);
    return (saved === 'a-z' || saved === 'z-a' || saved === 'custom') ? saved : 'a-z';
  });
  const [customOrder, setCustomOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STAFF_GRID_CUSTOM_ORDER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeFilters, setActiveFilters] = useState<Set<FilterOption>>(() => {
    try {
      const saved = localStorage.getItem(STAFF_GRID_FILTERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FilterOption[];
        return new Set(parsed);
      }
      return new Set();
    } catch {
      return new Set();
    }
  });
  const [arrangeMode, setArrangeMode] = useState(false);
  const [tempCustomOrder, setTempCustomOrder] = useState<string[]>([]); // Temp order during arrange mode

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STAFF_GRID_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(STAFF_GRID_SORT_KEY, sortMode);
  }, [sortMode]);

  useEffect(() => {
    localStorage.setItem(STAFF_GRID_FILTERS_KEY, JSON.stringify([...activeFilters]));
  }, [activeFilters]);

  // Persist custom order and initialize if empty
  useEffect(() => {
    localStorage.setItem(STAFF_GRID_CUSTOM_ORDER_KEY, JSON.stringify(customOrder));
  }, [customOrder]);

  // Initialize custom order from staffMembers if not set
  useEffect(() => {
    if (customOrder.length === 0 && staffMembers.length > 0) {
      // Sort A-Z first, then save as initial custom order
      const initialOrder = [...staffMembers]
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        .map(s => s.id);
      setCustomOrder(initialOrder);
    } else if (staffMembers.length > 0) {
      // Add any new staff members not in customOrder
      const existingIds = new Set(customOrder);
      const newStaff = staffMembers.filter(s => !existingIds.has(s.id));
      if (newStaff.length > 0) {
        setCustomOrder([...customOrder, ...newStaff.map(s => s.id)]);
      }
    }
  }, [staffMembers]);

  // Helper to check if staff has services on this ticket
  const staffHasServices = (staffId: string) => services.some(s => s.staffId === staffId);

  const getStaffInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStaffServiceCount = (staffId: string) => {
    return services.filter((s) => s.staffId === staffId).length;
  };

  const getStaffServiceTotal = (staffId: string) => {
    return services
      .filter((s) => s.staffId === staffId)
      .reduce((sum, s) => sum + s.price, 0);
  };

  // Get specialty colors for a staff member
  const getSpecialtyColors = (staff: StaffMember): SpecialtyColors => {
    const specialtyKey = staff.specialty || 'neutral';
    return SPECIALTY_COLORS[specialtyKey] || SPECIALTY_COLORS.neutral;
  };

  const reassigningServices = services.filter((s) =>
    reassigningServiceIds.includes(s.id)
  );

  // Toggle a filter on/off
  const toggleFilter = useCallback((filter: FilterOption) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  // Filter and sort staff
  const filteredStaff = useMemo(() => {
    let result = [...staffMembers];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((staff) =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply multi-select filters (OR logic - staff matches if they pass ANY active filter)
    if (activeFilters.size > 0) {
      result = result.filter((staff) => {
        // Helper functions for status checks
        const isReady = () => {
          // @ts-ignore - status may exist on extended staff objects
          if (staff.status) return staff.status === 'ready';
          return staff.available && !staffHasServices(staff.id);
        };
        const isBusy = () => {
          // @ts-ignore - status may exist on extended staff objects
          if (staff.status) return staff.status === 'busy';
          return staff.available && staffHasServices(staff.id);
        };
        const isOff = () => {
          // @ts-ignore - status may exist on extended staff objects
          if (staff.status) return staff.status === 'off';
          return !staff.available;
        };
        const isClockedIn = () => isReady() || isBusy();
        const isOnTicket = () => staffHasServices(staff.id);

        // Check if staff matches ANY active filter (OR logic)
        for (const filter of activeFilters) {
          switch (filter) {
            case 'clocked-in':
              if (isClockedIn()) return true;
              break;
            case 'ready':
              if (isReady()) return true;
              break;
            case 'busy':
              if (isBusy()) return true;
              break;
            case 'off':
              if (isOff()) return true;
              break;
            case 'on-ticket':
              if (isOnTicket()) return true;
              break;
          }
        }
        return false;
      });
    }

    // Apply sort
    // In arrange mode, use tempCustomOrder; otherwise use customOrder
    const activeOrder = arrangeMode ? tempCustomOrder : customOrder;
    if ((sortMode === 'custom' || arrangeMode) && activeOrder.length > 0) {
      // Sort by custom order
      const orderMap = new Map(activeOrder.map((id, index) => [id, index]));
      result.sort((a, b) => {
        const indexA = orderMap.get(a.id) ?? Infinity;
        const indexB = orderMap.get(b.id) ?? Infinity;
        return indexA - indexB;
      });
    } else if (!arrangeMode) {
      result.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (sortMode === 'a-z') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
    }

    return result;
  }, [staffMembers, searchQuery, activeFilters, sortMode, services, customOrder, arrangeMode, tempCustomOrder]);

  // Handle reorder during arrange mode (updates temp order, not saved yet)
  const handleReorder = useCallback((newOrder: StaffMember[]) => {
    const newIds = newOrder.map(s => s.id);
    setTempCustomOrder(newIds);
  }, []);

  // Enter arrange mode
  const enterArrangeMode = useCallback(() => {
    setTempCustomOrder([...customOrder]); // Copy current order to temp
    setArrangeMode(true);
  }, [customOrder]);

  // Save and exit arrange mode
  const saveArrangeMode = useCallback(() => {
    setCustomOrder(tempCustomOrder); // Save temp order to actual order
    setArrangeMode(false);
  }, [tempCustomOrder]);

  // Cancel and exit arrange mode
  const cancelArrangeMode = useCallback(() => {
    setTempCustomOrder([]); // Discard temp order
    setArrangeMode(false);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar with View Toggle */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        {/* Filter Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`min-w-[40px] min-h-[40px] p-2.5 rounded-lg transition-all duration-200 relative ${
                activeFilters.size > 0
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800'
              }`}
              aria-label="Filter staff"
            >
              <Filter size={18} strokeWidth={2} />
              {activeFilters.size > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilters.size}
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Select filters
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); toggleFilter('clocked-in'); }}
              className={activeFilters.has('clocked-in') ? 'bg-blue-50' : ''}
            >
              <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${activeFilters.has('clocked-in') ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                {activeFilters.has('clocked-in') && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
              <span className="flex-1">Clocked In</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); toggleFilter('ready'); }}
              className={activeFilters.has('ready') ? 'bg-emerald-50' : ''}
            >
              <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${activeFilters.has('ready') ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                {activeFilters.has('ready') && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <span className="flex-1">Ready</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); toggleFilter('busy'); }}
              className={activeFilters.has('busy') ? 'bg-rose-50' : ''}
            >
              <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${activeFilters.has('busy') ? 'bg-rose-500 border-rose-500' : 'border-gray-300'}`}>
                {activeFilters.has('busy') && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <div className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
              <span className="flex-1">Busy</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); toggleFilter('off'); }}
              className={activeFilters.has('off') ? 'bg-gray-100' : ''}
            >
              <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${activeFilters.has('off') ? 'bg-gray-500 border-gray-500' : 'border-gray-300'}`}>
                {activeFilters.has('off') && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
              <span className="flex-1">Clocked Out</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); toggleFilter('on-ticket'); }}
              className={activeFilters.has('on-ticket') ? 'bg-purple-50' : ''}
            >
              <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${activeFilters.has('on-ticket') ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                {activeFilters.has('on-ticket') && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <div className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
              <span className="flex-1">On This Ticket</span>
            </DropdownMenuItem>
            {activeFilters.size > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); clearAllFilters(); }}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  <span>Clear all filters</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="min-w-[40px] min-h-[40px] p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all duration-200"
              aria-label="Sort staff"
              disabled={arrangeMode}
            >
              {sortMode === 'a-z' ? (
                <ArrowUpAZ size={18} strokeWidth={2} />
              ) : sortMode === 'z-a' ? (
                <ArrowDownAZ size={18} strokeWidth={2} />
              ) : (
                <GripVertical size={18} strokeWidth={2} />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => setSortMode('a-z')}
              className={sortMode === 'a-z' ? 'bg-primary/10' : ''}
            >
              <ArrowUpAZ className="w-4 h-4 mr-2" />
              <span className="flex-1">A → Z</span>
              {sortMode === 'a-z' && <Check className="w-4 h-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortMode('z-a')}
              className={sortMode === 'z-a' ? 'bg-primary/10' : ''}
            >
              <ArrowDownAZ className="w-4 h-4 mr-2" />
              <span className="flex-1">Z → A</span>
              {sortMode === 'z-a' && <Check className="w-4 h-4 ml-2" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setSortMode('custom')}
              className={`${sortMode === 'custom' ? 'bg-primary/10' : ''} flex items-center justify-between`}
            >
              <div className="flex items-center">
                <GripVertical className="w-4 h-4 mr-2" />
                <span>Custom</span>
              </div>
              <div className="flex items-center gap-1">
                {sortMode === 'custom' && (
                  <Tippy content="Arrange order">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        enterArrangeMode();
                      }}
                      className="p-1 rounded hover:bg-amber-100 text-amber-600 hover:text-amber-700 transition-colors"
                      aria-label="Arrange custom order"
                    >
                      <Pencil size={14} strokeWidth={2} />
                    </button>
                  </Tippy>
                )}
                {sortMode === 'custom' && <Check className="w-4 h-4 ml-1" />}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode Toggle - Single chevron button */}
        <Tippy content={viewMode === 'normal' ? 'Switch to compact view' : 'Switch to normal view'}>
          <button
            onClick={() => setViewMode(viewMode === 'normal' ? 'compact' : 'normal')}
            className="min-w-[40px] min-h-[40px] p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all duration-200"
            aria-label={viewMode === 'normal' ? 'Switch to compact view' : 'Switch to normal view'}
          >
            {viewMode === 'normal' ? (
              <ChevronUp size={18} strokeWidth={2} />
            ) : (
              <ChevronDown size={18} strokeWidth={2} />
            )}
          </button>
        </Tippy>
      </div>

      {/* Active Filter Pills */}
      {activeFilters.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Filters:</span>
          {([...activeFilters] as FilterOption[]).map((filter) => {
            const config = FILTER_CONFIG[filter];
            return (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:opacity-80 ${config.color}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                {config.label}
                <X size={12} className="ml-0.5 opacity-60 hover:opacity-100" />
              </button>
            );
          })}
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {reassigningServices.length > 0 && (
        <Card className="p-3 mb-4 bg-primary/5 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Reassigning Staff</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a staff member for {reassigningServices.length} service{reassigningServices.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Arrange Mode Banner with Save/Cancel */}
      {arrangeMode && (
        <div className="mb-3 px-4 py-3 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <GripVertical size={18} className="text-amber-600" />
            <span className="font-medium">Drag cards to arrange custom order</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelArrangeMode}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={saveArrangeMode}
              className="px-3 py-1.5 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
            >
              <Save size={16} />
              Save Order
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Grid Container */}
      <div className="flex-1 overflow-y-auto">
        {staffMembers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">No Staff Available</h3>
                <p className="text-sm text-muted-foreground">
                  Add team members to assign services and manage appointments efficiently.
                </p>
              </div>
            </div>
          </Card>
        ) : filteredStaff.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              {activeFilters.size > 0 ? (
                <Filter className="h-10 w-10 text-muted-foreground/50" />
              ) : (
                <Search className="h-10 w-10 text-muted-foreground/50" />
              )}
              <div>
                <h3 className="font-semibold">No staff found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {(() => {
                    const filterLabels = [...activeFilters].map(f => FILTER_CONFIG[f].label).join(', ');

                    if (searchQuery && activeFilters.size > 0) {
                      return <>No staff matching "{searchQuery}" with filters: {filterLabels}</>;
                    } else if (searchQuery) {
                      return <>No staff matching "{searchQuery}"</>;
                    } else if (activeFilters.size > 0) {
                      return <>No staff matching filters: {filterLabels}</>;
                    }
                    return <>No staff available</>;
                  })()}
                </p>
                {activeFilters.size > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          /* Responsive Grid - fills the space with multiple rows */
          /* Use Reorder.Group for drag-drop only in arrange mode - horizontal single row for proper drag */
          arrangeMode ? (
            <Reorder.Group
              axis="x"
              values={filteredStaff}
              onReorder={handleReorder}
              className="flex gap-3 pb-4 overflow-x-auto"
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {filteredStaff.map((staff, index) => (
                <Reorder.Item
                  key={staff.id}
                  value={staff}
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                  whileDrag={{ scale: 1.05, zIndex: 50 }}
                >
                  <div
                    className="relative flex items-center gap-3 p-3 bg-white border-2 border-amber-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    style={{ width: '180px' }}
                  >
                    {/* Order Number */}
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                      {index + 1}
                    </div>
                    {/* Drag Handle */}
                    <div className="text-amber-400">
                      <GripVertical size={20} />
                    </div>
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: getSpecialtyColors(staff).base,
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      <span className="text-white font-bold text-xs">
                        {getStaffInitials(staff.name)}
                      </span>
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 truncate">
                        {staff.name.split(' ')[0]}
                      </h4>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
          <div className={`grid gap-4 pb-4 ${
            viewMode === 'compact'
              ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          }`}>
            {filteredStaff.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                viewMode={viewMode}
                services={services}
                selectedStaffId={selectedStaffId}
                onAddServiceToStaff={onAddServiceToStaff}
                getStaffInitials={getStaffInitials}
                getStaffServiceCount={getStaffServiceCount}
                getStaffServiceTotal={getStaffServiceTotal}
                getSpecialtyColors={getSpecialtyColors}
                isArrangeMode={false}
              />
            ))}
          </div>
          )
        )}
      </div>
    </div>
  );
}
