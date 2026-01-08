import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
} from "lucide-react";

export type ServiceStatus = "not_started" | "in_progress" | "paused" | "completed";

export interface TicketService {
  id: string;
  serviceId: string;
  serviceName: string;
  category?: string;
  price: number;
  duration: number;
  staffId?: string;
  staffName?: string;
  status: ServiceStatus;
  startTime?: Date;
  notes?: string;
  /** Metadata for special item types (gift cards, etc.) */
  metadata?: {
    type?: 'gift_card' | 'package' | 'product';
    deliveryMethod?: string;
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    message?: string;
    denominationId?: string;
    [key: string]: unknown;
  };
}

export type Specialty = 'neutral' | 'nails' | 'hair' | 'massage' | 'skincare' | 'waxing' | 'combo' | 'support';

export interface StaffMember {
  id: string;
  name: string;
  available: boolean;
  specialty?: Specialty;
}

interface ServiceListProps {
  services: TicketService[];
  staffMembers: StaffMember[];
  onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
  onRemoveService: (serviceId: string) => void;
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

export default function ServiceList({
  services,
  staffMembers,
  onUpdateService,
  onRemoveService,
}: ServiceListProps) {
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingDuration, setEditingDuration] = useState<string | null>(null);

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

  return (
    <div className="space-y-3">
      {services.map((service) => {
        const statusConfig = STATUS_CONFIG[service.status];
        const StatusIcon = statusConfig.icon;

        return (
          <Card key={service.id} className="p-4" data-testid={`card-service-${service.id}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-base mb-1" data-testid={`text-service-name-${service.id}`}>
                      {service.serviceName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
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
                            className="h-7 w-20"
                            autoFocus
                            data-testid={`input-price-${service.id}`}
                          />
                        ) : (
                          <span
                            onClick={() => setEditingPrice(service.id)}
                            className="cursor-pointer hover:text-foreground"
                          >
                            ${service.price}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
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
                            className="h-7 w-20"
                            autoFocus
                            data-testid={`input-duration-${service.id}`}
                          />
                        ) : (
                          <span
                            onClick={() => setEditingDuration(service.id)}
                            className="cursor-pointer hover:text-foreground"
                          >
                            {service.duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-testid={`button-menu-${service.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingPrice(service.id)}
                        data-testid={`menu-edit-price-${service.id}`}
                      >
                        Edit Price
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditingDuration(service.id)}
                        data-testid={`menu-edit-duration-${service.id}`}
                      >
                        Edit Duration
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onRemoveService(service.id)}
                        className="text-destructive"
                        data-testid={`menu-remove-${service.id}`}
                      >
                        Remove Service
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Select
                      value={service.staffId || ""}
                      onValueChange={(value) =>
                        onUpdateService(service.id, {
                          staffId: value,
                          staffName:
                            staffMembers.find((s) => s.id === value)?.name,
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-9 flex-1"
                        data-testid={`select-staff-${service.id}`}
                      >
                        <SelectValue placeholder="Assign staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem
                            key={staff.id}
                            value={staff.id}
                            data-testid={`option-staff-${staff.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-secondary">
                                    {getStaffInitials(staff.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div
                                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${getAvailabilityColor(staff.available)}`}
                                />
                              </div>
                              <span>{staff.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        data-testid={`button-status-${service.id}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">
                          {statusConfig.label}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                        const Icon = config.icon;
                        return (
                          <DropdownMenuItem
                            key={status}
                            onClick={() =>
                              onUpdateService(service.id, {
                                status: status as ServiceStatus,
                                startTime:
                                  status === "in_progress" ? new Date() : undefined,
                              })
                            }
                            data-testid={`option-status-${status}`}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {config.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
