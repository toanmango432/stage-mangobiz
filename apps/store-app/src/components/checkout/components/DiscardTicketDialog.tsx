import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Clock, Play, CreditCard, Trash2 } from "lucide-react";

export interface DiscardTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
  servicesCount: number;
  onCheckIn: () => void;
  onStartService: () => void;
  onSaveToPending: () => void;
  onDisregard: () => void;
}

export function DiscardTicketDialog({
  open,
  onOpenChange,
  clientName,
  servicesCount,
  onCheckIn,
  onStartService,
  onSaveToPending,
  onDisregard,
}: DiscardTicketDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md z-[100]" data-testid="dialog-exit-confirmation">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Save Ticket?
          </DialogTitle>
          <DialogDescription>
            {clientName && `Client: ${clientName}. `}
            {servicesCount > 0 && `${servicesCount} service(s) added. `}
            What would you like to do with this ticket?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {/* Check In - Add to Waitlist */}
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
            onClick={onCheckIn}
            data-testid="button-checkin"
          >
            <Clock className="h-6 w-6 text-blue-600" />
            <span className="font-medium">Check In</span>
            <span className="text-xs text-muted-foreground">Add to Waitlist</span>
          </Button>

          {/* Start Service - Add to In Service */}
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300"
            onClick={onStartService}
            data-testid="button-start-service"
          >
            <Play className="h-6 w-6 text-green-600" />
            <span className="font-medium">Start Service</span>
            <span className="text-xs text-muted-foreground">Begin immediately</span>
          </Button>

          {/* Save to Pending - Add to Pending (awaiting payment) */}
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
            onClick={onSaveToPending}
            data-testid="button-save-pending"
          >
            <CreditCard className="h-6 w-6 text-orange-600" />
            <span className="font-medium">Save to Pending</span>
            <span className="text-xs text-muted-foreground">Ready for payment</span>
          </Button>

          {/* Disregard - Close without saving */}
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-300"
            onClick={onDisregard}
            data-testid="button-disregard"
          >
            <Trash2 className="h-6 w-6 text-red-600" />
            <span className="font-medium">Disregard</span>
            <span className="text-xs text-muted-foreground">Don't save</span>
          </Button>
        </div>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-exit"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
