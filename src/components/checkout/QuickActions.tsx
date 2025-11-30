import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, CheckCircle2, Users, Scissors, Merge, Receipt, RotateCcw, Keyboard } from "lucide-react";
import { TicketService, StaffMember } from "./ServiceList";

interface QuickActionsProps {
  services: TicketService[];
  staffMembers: StaffMember[];
  onBulkUpdate: (updates: Partial<TicketService>) => void;
  onAssignAllToStaff: (staffId: string) => void;
  onSplitTicket?: () => void;
  onMergeTickets?: () => void;
  onOpenReceipt?: () => void;
  onOpenRefundVoid?: () => void;
  onOpenKeyboardShortcuts?: () => void;
}

export default function QuickActions({
  services,
  staffMembers,
  onBulkUpdate,
  onAssignAllToStaff,
  onSplitTicket,
  onMergeTickets,
  onOpenReceipt,
  onOpenRefundVoid,
  onOpenKeyboardShortcuts,
}: QuickActionsProps) {
  if (services.length === 0) return null;

  const unassignedCount = services.filter((s) => !s.staffId).length;
  const notStartedCount = services.filter((s) => s.status === "not_started").length;
  const canSplit = services.length >= 2;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          data-testid="button-more-actions"
        >
          <MoreHorizontal className="h-4 w-4" />
          More
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => {
            onBulkUpdate({ status: "in_progress" });
            console.log("Bulk update: all services in progress");
          }}
          disabled={notStartedCount === 0}
          data-testid="action-start-all"
        >
          <Play className="h-4 w-4 mr-2" />
          Start All Services ({notStartedCount})
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onBulkUpdate({ status: "completed" });
            console.log("Bulk update: all services completed");
          }}
          data-testid="action-complete-all"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Mark All Complete
        </DropdownMenuItem>

        {(onSplitTicket || onMergeTickets || onOpenReceipt || onOpenRefundVoid) && (
          <>
            <DropdownMenuSeparator />
            {onSplitTicket && (
              <DropdownMenuItem
                onClick={() => {
                  onSplitTicket();
                  console.log("Split ticket action triggered");
                }}
                disabled={!canSplit}
                data-testid="action-split-ticket"
              >
                <Scissors className="h-4 w-4 mr-2" />
                Split Ticket
              </DropdownMenuItem>
            )}
            {onMergeTickets && (
              <DropdownMenuItem
                onClick={() => {
                  onMergeTickets();
                  console.log("Merge tickets action triggered");
                }}
                data-testid="action-merge-tickets"
              >
                <Merge className="h-4 w-4 mr-2" />
                Merge with Other Tickets
              </DropdownMenuItem>
            )}
            {onOpenReceipt && (
              <DropdownMenuItem
                onClick={() => {
                  onOpenReceipt();
                  console.log("Receipt preview action triggered");
                }}
                data-testid="action-receipt-preview"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Preview Receipt
              </DropdownMenuItem>
            )}
            {onOpenRefundVoid && (
              <DropdownMenuItem
                onClick={() => {
                  onOpenRefundVoid();
                  console.log("Refund/void action triggered");
                }}
                data-testid="action-refund-void"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refund / Void
              </DropdownMenuItem>
            )}
          </>
        )}

        {onOpenKeyboardShortcuts && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onOpenKeyboardShortcuts();
              }}
              data-testid="action-keyboard-shortcuts"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Keyboard Shortcuts
              <span className="ml-auto text-xs text-muted-foreground font-mono">?</span>
            </DropdownMenuItem>
          </>
        )}

        {unassignedCount > 0 && staffMembers.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Assign All To:
            </div>
            {staffMembers.slice(0, 5).map((staff) => (
              <DropdownMenuItem
                key={staff.id}
                onClick={() => {
                  onAssignAllToStaff(staff.id);
                  console.log("Assigned all to:", staff.name);
                }}
                data-testid={`action-assign-all-${staff.id}`}
              >
                <Users className="h-4 w-4 mr-2" />
                {staff.name}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
