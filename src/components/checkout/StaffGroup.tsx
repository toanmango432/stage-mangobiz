import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
// Avatar/Badge not currently used - using custom div for StaffCard alignment
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Circle,
  MoreVertical,
  RotateCcw,
  UserPlus,
  Shuffle,
  ArrowLeft,
  Copy,
  Clock,
  // Plus removed - Add Service button no longer used
} from "lucide-react";
import { TicketService, ServiceStatus } from "./ServiceList";
import { Reorder, motion, PanInfo } from "framer-motion";

interface StaffGroupProps {
  staffId: string | null;
  staffName: string | null;
  services: TicketService[];
  onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
  onRemoveService: (serviceId: string) => void;
  onRemoveStaff?: (staffId: string) => void;
  onReassignStaff: (serviceIdOrIds: string | string[]) => void;
  onAddServiceToStaff: () => void;
  onEditService?: (serviceIds: string[]) => void;
  onChangeService?: (serviceIds: string[]) => void;
  onDiscountService?: (serviceIds: string[]) => void;
  onDuplicateServices?: (serviceIds: string[]) => void;
  selectedServices?: Set<string>;
  onToggleServiceSelection?: (serviceId: string) => void;
  onClearSelection?: () => void;
  isActive?: boolean;
  onActivate?: () => void;
  totalStaffCount?: number;
}

// STATUS_CONFIG - kept for future use if status badges are re-added
// const STATUS_CONFIG = {
//   not_started: { label: "Not Started", icon: Circle },
//   in_progress: { label: "In Progress", icon: Play },
//   paused: { label: "Paused", icon: Pause },
//   completed: { label: "Completed", icon: CheckCircle2 },
// };

function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface ServiceItemProps {
  service: TicketService;
  isSelected: boolean;
  isInactive: boolean;
  elapsedTime: number;
  onToggleSelection: (serviceId: string, event: React.MouseEvent) => void;
  onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
  onDuplicateService: (service: TicketService) => void;
  onDeleteService?: (serviceId: string) => void;
}

function ServiceItem({
  service,
  isSelected,
  isInactive,
  elapsedTime,
  onToggleSelection,
  onUpdateService,
  onDuplicateService,
  onDeleteService,
}: ServiceItemProps) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(service.price.toString());
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeRevealed, setIsSwipeRevealed] = useState(false);

  const progressPercentage = service.status === 'in_progress' && service.duration > 0
    ? Math.min((elapsedTime / (service.duration * 60)) * 100, 100)
    : service.status === 'completed'
      ? 100
      : 0;

  const handlePriceEdit = (newPrice: string) => {
    const parsed = parseFloat(newPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateService(service.id, { price: parsed });
    }
    setEditingPrice(false);
  };

  const handlePriceAdjustment = (amount: number) => {
    const newPrice = Math.max(0, service.price + amount);
    onUpdateService(service.id, { price: newPrice });
  };

  const handlePan = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Only allow left swipe (negative offset)
    const offset = Math.min(0, info.offset.x);
    setSwipeOffset(offset);

    // Reveal delete button if swiped more than 40px
    if (offset < -40) {
      setIsSwipeRevealed(true);
    } else {
      setIsSwipeRevealed(false);
    }
  };

  const handlePanEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Snap to revealed or hidden state
    if (info.offset.x < -60) {
      // Snap to revealed
      setSwipeOffset(-80);
      setIsSwipeRevealed(true);
    } else {
      // Snap back to hidden
      setSwipeOffset(0);
      setIsSwipeRevealed(false);
    }
  };

  const handleDelete = () => {
    if (onDeleteService) {
      onDeleteService(service.id);
    }
  };

  return (
    <div className="relative overflow-hidden" data-testid={`service-item-container-${service.id}`}>
      {/* Delete Action (behind the service item) */}
      <div className={`swipe-delete-action ${isSwipeRevealed ? 'visible' : ''}`}>
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11 text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
          onClick={handleDelete}
          data-testid={`button-delete-swipe-${service.id}`}
          aria-label={`Delete ${service.serviceName} service`}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Swipeable Service Item */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        animate={{ x: swipeOffset }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-2 transition-colors bg-card ${
          isInactive 
            ? 'cursor-default' 
            : 'cursor-pointer hover-elevate'
        } ${
          isSelected ? 'bg-primary/10 border-l-4 border-l-primary -ml-px' : ''
        }`}
        onClick={(e) => {
          if (!isInactive && swipeOffset === 0) {
            onToggleSelection(service.id, e as any);
          }
        }}
        data-testid={`service-item-${service.id}`}
      >
      {/* Top Row: Name, Price, Actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{service.serviceName}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Clock className="h-3 w-3" />
            <span>{service.duration}m</span>
            {service.status === 'in_progress' && (
              <>
                <span>•</span>
                <span className="font-medium text-primary" data-testid={`timer-${service.id}`}>
                  {formatElapsedTime(elapsedTime)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Price with inline editing and quick adjustments */}
        <div className="flex items-center gap-1">
          {editingPrice ? (
            <Input
              type="number"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              onBlur={() => handlePriceEdit(tempPrice)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePriceEdit(tempPrice);
                if (e.key === 'Escape') {
                  setTempPrice(service.price.toString());
                  setEditingPrice(false);
                }
              }}
              className="h-7 w-20 text-sm"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              data-testid={`input-price-${service.id}`}
            />
          ) : (
            <>
              <div className="flex flex-col items-end gap-0.5">
                <div
                  className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPrice(true);
                  }}
                  data-testid={`text-price-${service.id}`}
                >
                  ${service.price.toFixed(2)}
                </div>
                <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4 text-xs"
                    onClick={() => handlePriceAdjustment(-10)}
                    disabled={isInactive}
                    data-testid={`button-price-minus-10-${service.id}`}
                  >
                    <span className="text-[9px] leading-none">-10</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4 text-xs"
                    onClick={() => handlePriceAdjustment(-5)}
                    disabled={isInactive}
                    data-testid={`button-price-minus-5-${service.id}`}
                  >
                    <span className="text-[9px] leading-none">-5</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4 text-xs"
                    onClick={() => handlePriceAdjustment(5)}
                    disabled={isInactive}
                    data-testid={`button-price-plus-5-${service.id}`}
                  >
                    <span className="text-[9px] leading-none">+5</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-4 w-4 text-xs"
                    onClick={() => handlePriceAdjustment(10)}
                    disabled={isInactive}
                    data-testid={`button-price-plus-10-${service.id}`}
                  >
                    <span className="text-[9px] leading-none">+10</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Duplicate Button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          disabled={isInactive}
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateService(service);
          }}
          data-testid={`button-duplicate-${service.id}`}
          aria-label={`Duplicate ${service.serviceName} service`}
        >
          <Copy className="h-4 w-4" />
        </Button>

        {/* More Options */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          disabled={isInactive}
          onClick={(e) => {
            e.stopPropagation();
            if (!isInactive) {
              onToggleSelection(service.id, e);
            }
          }}
          data-testid={`button-service-options-${service.id}`}
          aria-label={`More options for ${service.serviceName}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar (only shown if in-progress or completed) */}
      {(service.status === 'in_progress' || service.status === 'completed') && (
        <div className="flex items-center gap-2">
          <Progress 
            value={progressPercentage} 
            className="h-1.5 flex-1"
            data-testid={`progress-${service.id}`}
          />
          <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}
      </motion.div>
    </div>
  );
}

export default function StaffGroup({
  staffId,
  staffName,
  services,
  onUpdateService,
  onRemoveService,
  onRemoveStaff,
  onReassignStaff,
  onAddServiceToStaff: _onAddServiceToStaff, // Kept for interface, button removed
  onDuplicateServices,
  selectedServices = new Set(),
  onToggleServiceSelection,
  isActive = false,
  onActivate,
  totalStaffCount = 1,
}: StaffGroupProps) {
  // Timer tracking for in-progress services
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({});
  // Status change announcements for screen readers
  const [statusAnnouncement] = useState<string>("");
  const [orderedServices, setOrderedServices] = useState(services);

  // Update ordered services when services prop changes
  useEffect(() => {
    setOrderedServices(services);
  }, [services]);

  // Timer effect - updates every second for in-progress services
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTimes((prev) => {
        const updated = { ...prev };
        services.forEach((service) => {
          if (service.status === 'in_progress') {
            const startTime = service.startTime ? new Date(service.startTime).getTime() : Date.now();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            updated[service.id] = elapsed;
          } else if (service.status === 'completed' && service.startTime) {
            // Keep the elapsed time at completion
            if (!updated[service.id]) {
              updated[service.id] = service.duration * 60;
            }
          } else {
            // Reset for not_started or paused
            updated[service.id] = 0;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [services]);

  const getStaffInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const totalAmount = services.reduce((sum, s) => sum + s.price, 0);
  // totalDuration not currently displayed in simplified header
  // const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

  // Determine staff-level status
  const allCompleted = services.length > 0 && services.every((s) => s.status === "completed");
  const anyInProgress = services.some((s) => s.status === "in_progress");
  const canStart = services.some((s) => s.status === "not_started" || s.status === "paused");
  const canComplete = services.some((s) => s.status !== "completed");

  // Get overall status for display - kept for future use
  // const getOverallStatus = () => {
  //   if (services.length === 0) return "not_started";
  //   if (allCompleted) return "completed";
  //   if (anyInProgress) return "in_progress";
  //   const anyPaused = services.some((s) => s.status === "paused");
  //   if (anyPaused) return "paused";
  //   return "not_started";
  // };
  // const overallStatus = getOverallStatus();
  // const statusConfig = STATUS_CONFIG[overallStatus];
  // const StatusIcon = statusConfig.icon;

  const handleStaffStatusAction = () => {
    if (anyInProgress) {
      // Pause all in-progress services
      services
        .filter((s) => s.status === "in_progress")
        .forEach((s) => onUpdateService(s.id, { status: "paused" }));
    } else if (canStart) {
      // Start all not-started or paused services
      services
        .filter((s) => s.status === "not_started" || s.status === "paused")
        .forEach((s) => onUpdateService(s.id, { status: "in_progress", startTime: new Date() }));
    }
  };

  const handleCompleteAll = () => {
    services
      .filter((s) => s.status !== "completed")
      .forEach((s) => onUpdateService(s.id, { status: "completed" }));
  };

  const handleToggleService = (serviceId: string, _event: React.MouseEvent) => {
    if (onToggleServiceSelection) {
      onToggleServiceSelection(serviceId);
    }
  };

  const handleDuplicateService = (service: TicketService) => {
    if (onDuplicateServices) {
      onDuplicateServices([service.id]);
    }
  };

  const handleReorder = (newOrder: TicketService[]) => {
    setOrderedServices(newOrder);
  };

  const handleStaffOptions = (action: string, status?: ServiceStatus) => {
    switch (action) {
      case "assign":
        // Trigger assign staff for all services in this group
        const allServiceIds = services.map(s => s.id);
        if (allServiceIds.length > 0) {
          onReassignStaff(allServiceIds);
        }
        break;
      case "change_all_status":
        if (status) {
          services.forEach(s => onUpdateService(s.id, { status }));
        }
        break;
      case "reset":
        services.forEach(s => onUpdateService(s.id, { status: "not_started" }));
        break;
      case "remove":
        if (staffId && onRemoveStaff) {
          // Use the remove staff callback if available
          onRemoveStaff(staffId);
        } else {
          // Fallback: just remove services
          services.forEach(s => onRemoveService(s.id));
        }
        break;
    }
  };


  // Determine if we should show activation UI
  const showActivation = totalStaffCount > 1 && staffId;
  const isInactive = Boolean(!isActive && showActivation);
  
  return (
    <>
      {/* ARIA Live Region for Status Announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {statusAnnouncement}
      </div>

      <Card className={`overflow-hidden transition-all duration-200 rounded-xl ${
        isActive && staffId
          ? 'border-2 border-primary/30 shadow-lg shadow-primary/10 ring-2 ring-primary/20 bg-primary/5'
          : staffId
            ? 'border border-border'
            : 'border-2 border-destructive/50'
      } ${isInactive ? 'opacity-60 saturate-75 cursor-pointer hover:opacity-80 hover:shadow-md' : ''}`}
      onClick={(e) => {
        // Make inactive staff clickable to activate (only if multiple staff exist)
        if (isInactive && onActivate) {
          const target = e.target as HTMLElement;
          // Don't activate if clicking on buttons or interactive elements
          if (!target.closest('button') && !target.closest('[role="button"]')) {
            onActivate();
          }
        }
      }}
      data-testid={`staff-group-${staffId || 'unassigned'}`}
      >
      {/* Active Staff Indicator - Shows when staff is active */}
      {isActive && staffId && (
        <div className="bg-gradient-to-r from-primary to-primary/90 px-4 py-1.5 flex items-center justify-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-semibold text-white tracking-wide uppercase">
            Adding Services Here
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        </div>
      )}
      
      {/* Inactive Staff Indicator - Shows click hint */}
      {isInactive && (
        <div className="bg-muted/50 px-4 py-1.5 flex items-center justify-center border-b gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Inactive - Click to Activate
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        </div>
      )}
      
      {/* Staff Header - Aligned with StaffCard design from FrontDesk */}
      <div className={`p-4 border-b border-border/50 flex items-center justify-between ${
        isActive && staffId
          ? 'bg-gradient-to-r from-slate-50 to-slate-100/50'
          : ''
      }`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {staffName ? (
            <>
              {/* Avatar - Matching StaffCard circular style with gradient */}
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                style={{
                  background: 'linear-gradient(to bottom right, #FFFFFF, #F8FAFC)',
                  border: '2px solid #E5E5E5',
                }}
              >
                <span
                  className="font-black text-sm tracking-widest uppercase"
                  style={{
                    color: '#525252',
                    textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                  }}
                >
                  {getStaffInitials(staffName)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {/* Name - Matching StaffCard uppercase bold style */}
                  <h3
                    className="font-black text-sm tracking-wide uppercase truncate"
                    style={{ color: '#525252' }}
                  >
                    {staffName}
                  </h3>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {services.length} {services.length === 1 ? "service" : "services"} · ${totalAmount.toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <Button
                  variant="destructive"
                  size="default"
                  className="mb-2"
                  onClick={() => handleStaffOptions("assign")}
                  data-testid="button-assign-staff-primary"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Staff
                </Button>
                <p className="text-xs text-muted-foreground">
                  {services.length} {services.length === 1 ? "service" : "services"} • ${totalAmount.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Staff-level Actions - Disabled when inactive */}
        <div className="flex items-center gap-1">
          {canComplete && staffId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCompleteAll}
              disabled={isInactive}
              className="h-9 text-xs gap-1"
              data-testid={`button-complete-all-${staffId || "unassigned"}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Complete All</span>
            </Button>
          )}
          {!allCompleted && staffId && (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={handleStaffStatusAction}
              disabled={isInactive}
              data-testid={`button-staff-status-${staffId || "unassigned"}`}
              aria-label={anyInProgress ? `Pause all services for ${staffName}` : `Start all services for ${staffName}`}
            >
              {anyInProgress ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
          )}
          
          {/* More Options Dropdown - Disabled when inactive */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                disabled={isInactive}
                data-testid={`button-staff-options-${staffId || "unassigned"}`}
                aria-label={`More options for ${staffName || 'unassigned services'}`}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!staffId && (
                <>
                  <DropdownMenuItem 
                    onClick={() => handleStaffOptions("assign")}
                    data-testid="option-assign-staff"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Staff
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Change Status Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger data-testid="submenu-change-status">
                  <Shuffle className="mr-2 h-4 w-4" />
                  Change Status
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem 
                    onClick={() => handleStaffOptions("change_all_status", "not_started")}
                    data-testid="option-status-not-started"
                  >
                    <Circle className="mr-2 h-4 w-4" />
                    Not Started
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStaffOptions("change_all_status", "in_progress")}
                    data-testid="option-status-in-service"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    In Service
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStaffOptions("change_all_status", "paused")}
                    data-testid="option-status-pause"
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleStaffOptions("change_all_status", "completed")}
                    data-testid="option-status-done"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Done
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuItem 
                onClick={() => handleStaffOptions("reset")}
                data-testid="option-reset-items"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Items
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleStaffOptions("remove")}
                className="text-destructive"
                data-testid="option-remove-staff"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove {staffId ? "Staff" : "All"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Services List with Drag & Drop */}
      <div>
        {services.length === 0 && staffId ? (
          <div className="px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Click a service to add to {staffName}</span>
            </div>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={orderedServices}
            onReorder={handleReorder}
            className="divide-y"
          >
            {orderedServices.map((service) => {
              const isSelected = selectedServices.has(service.id);
              const elapsedTime = elapsedTimes[service.id] || 0;

              return (
                <Reorder.Item
                  key={service.id}
                  value={service}
                  className="list-none"
                  data-testid={`reorder-item-${service.id}`}
                >
                  <ServiceItem
                    service={service}
                    isSelected={isSelected}
                    isInactive={isInactive}
                    elapsedTime={elapsedTime}
                    onToggleSelection={handleToggleService}
                    onUpdateService={onUpdateService}
                    onDuplicateService={handleDuplicateService}
                    onDeleteService={onRemoveService}
                  />
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}

        {/* Add Service button removed - redundant since:
            1. "ADDING SERVICES HERE" banner clearly shows active staff
            2. Left panel services automatically add to active staff
            3. Pulsing dot indicator reinforces which staff is active */}
      </div>
      </Card>
    </>
  );
}
