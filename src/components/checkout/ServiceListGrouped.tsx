import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/Input";
import {
  MoreVertical,
  Clock,
  DollarSign,
  User,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Shuffle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { TicketService, StaffMember } from "./ServiceList";

interface ServiceListGroupedProps {
  services: TicketService[];
  staffMembers: StaffMember[];
  onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
  onRemoveService: (serviceId: string) => void;
  onRemoveStaff?: (staffId: string) => void;
  onAddServiceToStaff?: (staffId: string, staffName: string) => void;
  onAddStaff?: (staffId: string, staffName: string) => void;
  activeStaffId?: string | null;
  onSetActiveStaff?: (staffId: string | null) => void;
  assignedStaffIds?: Set<string>;
}

const STATUS_CONFIG = {
  not_started: {
    label: "Not Started",
    icon: Circle,
    color: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Play,
    color: "bg-accent text-accent-foreground",
  },
  paused: {
    label: "Paused",
    icon: Pause,
    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-green-500/10 text-green-700 dark:text-green-400",
  },
};

export default function ServiceListGrouped({
  services,
  staffMembers,
  onUpdateService,
  onRemoveService,
  onRemoveStaff,
  onAddServiceToStaff,
  onAddStaff,
  activeStaffId,
  onSetActiveStaff,
  assignedStaffIds = new Set(),
}: ServiceListGroupedProps) {
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set());

  const getStaffInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvailabilityColor = (available: boolean) => {
    return available ? "bg-green-500" : "bg-gray-400";
  };

  const toggleStaffExpanded = (staffId: string) => {
    const newExpanded = new Set(expandedStaff);
    if (newExpanded.has(staffId)) {
      newExpanded.delete(staffId);
    } else {
      newExpanded.add(staffId);
    }
    setExpandedStaff(newExpanded);
  };

  // Group services by staff
  const groupedServices = services.reduce((groups, service) => {
    const key = service.staffId || "unassigned";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(service);
    return groups;
  }, {} as Record<string, TicketService[]>);

  // Unassigned services first, then by staff
  const unassignedServices = groupedServices["unassigned"] || [];
  const staffGroups = Object.entries(groupedServices).filter(
    ([key]) => key !== "unassigned"
  );

  // Create entries for assigned staff with no services
  const emptyStaffGroups = Array.from(assignedStaffIds)
    .filter(staffId => !groupedServices[staffId])
    .map(staffId => [staffId, []] as [string, TicketService[]]);

  const handleStaffCardClick = (staffId: string) => {
    if (onSetActiveStaff) {
      onSetActiveStaff(staffId);
    }
  };

  const allStaffGroups = [...staffGroups, ...emptyStaffGroups];

  return (
    <div className="space-y-3">
      {/* Unassigned Services */}
      {unassignedServices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Unassigned ({unassignedServices.length})
            </span>
          </div>
          <div className="space-y-2">
            {unassignedServices.map((service) => (
              <Card key={service.id} className="p-3" data-testid={`card-service-${service.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1">
                      {service.serviceName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>${service.price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{service.duration} min</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Select
                        value={service.staffId || ""}
                        onValueChange={(value) =>
                          onUpdateService(service.id, {
                            staffId: value,
                            staffName: staffMembers.find((s) => s.id === value)?.name,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-staff-${service.id}`}>
                          <SelectValue placeholder="Assign staff" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffMembers.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {getStaffInitials(staff.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{staff.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onRemoveService(service.id)}>
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Staff Groups */}
      {allStaffGroups.map(([staffId, staffServices]) => {
        const staff = staffMembers.find((s) => s.id === staffId);
        const isExpanded = expandedStaff.has(staffId);
        const isActive = staffId === activeStaffId;
        const totalPrice = staffServices.reduce((sum, s) => sum + s.price, 0);
        const totalDuration = staffServices.reduce((sum, s) => sum + s.duration, 0);

        return (
          <Card
            key={staffId}
            className={`overflow-hidden transition-all ${
              isActive ? "ring-2 ring-primary shadow-md" : ""
            }`}
            data-testid={`card-staff-group-${staffId}`}
          >
            <div
              className={`p-3 cursor-pointer hover-elevate ${
                isActive ? "bg-primary/5" : "bg-muted/20"
              }`}
              onClick={() => {
                toggleStaffExpanded(staffId);
                handleStaffCardClick(staffId);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                        {staff ? getStaffInitials(staff.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    {staff && (
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getAvailabilityColor(staff.available)}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h4 className="font-semibold text-sm">
                        {staff?.name || "Unknown Staff"}
                      </h4>
                      <Badge variant="secondary" className="text-xs h-5">
                        {staffServices.length} service{staffServices.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {staffServices.length > 0 && (
                        <>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">${totalPrice}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{totalDuration} min</span>
                          </div>
                        </>
                      )}
                      {staffServices.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No services yet</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-staff-actions-${staffId}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Change Status Submenu */}
                      {staffServices.length > 0 && (
                        <>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger data-testid={`submenu-change-status-${staffId}`}>
                              <Shuffle className="mr-2 h-4 w-4" />
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem 
                                onClick={() => {
                                  staffServices.forEach(s => onUpdateService(s.id, { status: "not_started" }));
                                }}
                                data-testid={`option-status-not-started-${staffId}`}
                              >
                                <Circle className="mr-2 h-4 w-4" />
                                Not Started
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  staffServices.forEach(s => onUpdateService(s.id, { status: "in_progress" }));
                                }}
                                data-testid={`option-status-in-progress-${staffId}`}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  staffServices.forEach(s => onUpdateService(s.id, { status: "paused" }));
                                }}
                                data-testid={`option-status-paused-${staffId}`}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Paused
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  staffServices.forEach(s => onUpdateService(s.id, { status: "completed" }));
                                }}
                                data-testid={`option-status-completed-${staffId}`}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Completed
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          
                          <DropdownMenuItem 
                            onClick={() => {
                              staffServices.forEach(s => onUpdateService(s.id, { status: "not_started" }));
                            }}
                            data-testid={`option-reset-items-${staffId}`}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Items
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={() => {
                          const message = staffServices.length > 0
                            ? `Remove all ${staffServices.length} service(s) for ${staff?.name || 'this staff'}?`
                            : `Remove ${staff?.name || 'this staff'} from ticket?`;
                          
                          if (confirm(message)) {
                            if (onRemoveStaff) {
                              onRemoveStaff(staffId);
                            } else {
                              // Fallback: just remove services
                              staffServices.forEach(s => onRemoveService(s.id));
                            }
                          }
                        }}
                        className="text-destructive"
                        data-testid={`option-remove-staff-${staffId}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Staff
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    data-testid={`button-toggle-staff-${staffId}`}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t">
                {onAddServiceToStaff && (
                  <div className="px-3 py-2 border-b">
                    <button
                      onClick={() => onAddServiceToStaff(staffId, staff?.name || "")}
                      className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                      data-testid={`button-add-service-to-${staffId}`}
                    >
                      + Add service
                    </button>
                  </div>
                )}
                {staffServices.map((service, index) => {
                  STATUS_CONFIG[service.status];

                  return (
                    <div
                      key={service.id}
                      className={`px-3 py-2.5 ${
                        index < staffServices.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm mb-1.5">
                            {service.serviceName}
                          </h5>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {editingPrice === service.id ? (
                                <Input
                                  type="number"
                                  value={service.price}
                                  onChange={(e) =>
                                    onUpdateService(service.id, {
                                      price: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  onBlur={() => setEditingPrice(null)}
                                  className="h-6 w-16 text-xs"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingPrice(service.id)}
                                  className="cursor-pointer hover:text-primary"
                                >
                                  ${service.price}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {editingDuration === service.id ? (
                                <Input
                                  type="number"
                                  value={service.duration}
                                  onChange={(e) =>
                                    onUpdateService(service.id, {
                                      duration: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  onBlur={() => setEditingDuration(null)}
                                  className="h-6 w-16 text-xs"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => setEditingDuration(service.id)}
                                  className="cursor-pointer hover:text-primary"
                                >
                                  {service.duration} min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                if (onAddServiceToStaff && service.staffId && service.staffName) {
                                  const newService = {
                                    ...service,
                                    id: Math.random().toString(),
                                  };
                                  onUpdateService(newService.id, newService);
                                }
                              }}
                            >
                              Duplicate Service
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditingPrice(service.id)}
                            >
                              Edit Price
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setEditingDuration(service.id)}
                            >
                              Edit Duration
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onRemoveService(service.id)}
                              className="text-destructive"
                            >
                              Remove Service
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
