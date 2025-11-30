import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserCircle2,
  RefreshCw,
  DollarSign,
  Percent,
  Circle,
  Play,
  Pause,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ServiceStatus } from "./ServiceList";

interface BulkActionsPopupProps {
  selectedCount: number;
  onReset: () => void;
  onAction: (action: string, statusValue?: ServiceStatus) => void;
  staffName?: string | null;
}

export function BulkActionsPopup({
  selectedCount,
  onReset,
  onAction,
  staffName,
}: BulkActionsPopupProps) {
  return (
    <div 
      className="absolute top-0 left-0 right-0 z-50 animate-in slide-in-from-top-3 fade-in duration-200"
      data-testid="bulk-actions-popup"
    >
      <Card className="w-full shadow-2xl border-2 border-primary/20">
        {/* Compact Header */}
        <div className="bg-primary/10 px-3 py-2 border-b flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {selectedCount}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold">
                {selectedCount === 1 ? "Service" : "Services"}
              </span>
              {staffName && (
                <>
                  <span className="text-sm text-muted-foreground">·</span>
                  <span className="text-sm font-medium text-muted-foreground truncate">
                    {staffName}
                  </span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto"
            onClick={onReset}
            data-testid="button-reset-selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Horizontal Action Buttons */}
        <div className="p-2 flex items-center gap-1.5 flex-wrap max-w-md">
          <Button
            variant="secondary"
            size="sm"
            className="h-8"
            onClick={() => onAction("reassign")}
            data-testid="bulk-action-reassign"
          >
            <UserCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Reassign
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="h-8"
            onClick={() => onAction("change_item")}
            data-testid="bulk-action-change-item"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Change
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="h-8"
            onClick={() => onAction("change_price")}
            data-testid="bulk-action-change-price"
          >
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Price
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="h-8"
            onClick={() => onAction("discount")}
            data-testid="bulk-action-discount"
          >
            <Percent className="mr-1.5 h-3.5 w-3.5" />
            Discount
          </Button>

          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-8"
                data-testid="bulk-action-status-menu"
              >
                Status
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onAction("change_status", "not_started")}
                data-testid="bulk-action-status-not-started"
              >
                <Circle className="mr-2 h-4 w-4" />
                Not Started
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onAction("change_status", "in_progress")}
                data-testid="bulk-action-status-in-service"
              >
                <Play className="mr-2 h-4 w-4" />
                In Service
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onAction("change_status", "paused")}
                data-testid="bulk-action-status-pause"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onAction("change_status", "completed")}
                data-testid="bulk-action-status-done"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Done
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="secondary"
            size="sm"
            className="h-8"
            onClick={() => onAction("duplicate")}
            data-testid="bulk-action-duplicate"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Duplicate
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            onClick={() => onAction("remove")}
            data-testid="bulk-action-remove"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </Card>
    </div>
  );
}
