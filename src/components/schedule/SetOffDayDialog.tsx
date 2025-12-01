import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface SetOffDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  day: string;
  onConfirm: (reason: string) => void;
}

export function SetOffDayDialog({
  open,
  onOpenChange,
  staffName,
  day,
  onConfirm,
}: SetOffDayDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || "Personal");
    setReason("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Off Day</DialogTitle>
          <DialogDescription>
            Mark {day} as an off day for {staffName}. Please provide a reason (optional).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for time off (e.g., Personal, Sick, Vacation)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Set Off Day
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}