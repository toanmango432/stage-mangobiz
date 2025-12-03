import { useState } from "react";
import { X, AlertTriangle, FileText, DollarSign, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ClientAlertData {
  // Basic client info for display
  firstName?: string;
  lastName?: string;

  // Alert-related fields
  allergies?: string[];
  staffAlert?: {
    message: string;
    createdAt?: string;
    createdBy?: string;
    createdByName?: string;
  };
  notes?: string; // Simple notes string
  outstandingBalance?: number;
  isBlocked?: boolean;
  blockReason?: string;
  blockReasonNote?: string;
}

interface ClientAlertsProps {
  client: ClientAlertData | null;
  onBlockedOverride?: () => void;
  onDismissAlert?: (alertType: "allergy" | "notes" | "balance") => void;
}

export default function ClientAlerts({
  client,
  onBlockedOverride,
  onDismissAlert,
}: ClientAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);

  if (!client) return null;

  const handleDismiss = (alertType: "allergy" | "notes" | "balance") => {
    setDismissedAlerts((prev) => new Set([...prev, alertType]));
    onDismissAlert?.(alertType);
  };

  const hasAllergies = client.allergies && client.allergies.length > 0;
  const hasStaffAlert = client.staffAlert?.message;
  const hasNotes = client.notes && client.notes.trim().length > 0;
  const hasBalance = client.outstandingBalance && client.outstandingBalance > 0;
  const isBlocked = client.isBlocked;

  // Show blocked dialog automatically if client is blocked
  if (isBlocked && !showBlockedDialog) {
    // Set it on next tick to avoid render loop
    setTimeout(() => setShowBlockedDialog(true), 0);
  }

  const showAllergyAlert = hasAllergies && !dismissedAlerts.has("allergy");
  const showNotesAlert = (hasStaffAlert || hasNotes) && !dismissedAlerts.has("notes");
  const showBalanceAlert = hasBalance && !dismissedAlerts.has("balance");

  if (!showAllergyAlert && !showNotesAlert && !showBalanceAlert && !isBlocked) {
    return null;
  }

  return (
    <>
      <div className="space-y-2 mb-3">
        {/* Allergy Alert - Red/Urgent */}
        {showAllergyAlert && (
          <div
            className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200"
            role="alert"
            data-testid="alert-allergy"
          >
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-800">Allergy Alert</p>
              <p className="text-xs text-red-700 mt-0.5">
                {client.allergies?.join(", ")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-red-600 hover:text-red-800 hover:bg-red-100 flex-shrink-0"
              onClick={() => handleDismiss("allergy")}
              aria-label="Dismiss allergy alert"
              data-testid="button-dismiss-allergy"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Staff Notes Alert - Yellow/Warning */}
        {showNotesAlert && (
          <div
            className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200"
            role="alert"
            data-testid="alert-notes"
          >
            <FileText className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">Staff Notes</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {hasStaffAlert ? client.staffAlert?.message : client.notes}
              </p>
              {hasStaffAlert && client.staffAlert?.createdByName && (
                <p className="text-[10px] text-amber-600 mt-1">
                  — {client.staffAlert.createdByName}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 flex-shrink-0"
              onClick={() => handleDismiss("notes")}
              aria-label="Dismiss notes alert"
              data-testid="button-dismiss-notes"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Outstanding Balance Alert - Orange */}
        {showBalanceAlert && (
          <div
            className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-200"
            role="alert"
            data-testid="alert-balance"
          >
            <DollarSign className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-orange-800">Outstanding Balance</p>
              <p className="text-xs text-orange-700 mt-0.5">
                ${client.outstandingBalance?.toFixed(2)} due
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-orange-600 hover:text-orange-800 hover:bg-orange-100 flex-shrink-0"
              onClick={() => handleDismiss("balance")}
              aria-label="Dismiss balance alert"
              data-testid="button-dismiss-balance"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Blocked Client Dialog */}
      <AlertDialog open={showBlockedDialog} onOpenChange={setShowBlockedDialog}>
        <AlertDialogContent data-testid="dialog-blocked-client">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Blocked Client
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>{client.firstName} {client.lastName}</strong> is currently blocked
                from booking services.
              </p>
              {client.blockReason && (
                <p className="text-sm">
                  <span className="font-medium">Reason:</span>{" "}
                  {client.blockReason.replace(/_/g, " ")}
                  {client.blockReasonNote && ` - ${client.blockReasonNote}`}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Would you like to proceed anyway? A manager override may be required.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-blocked">
              Select Different Client
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowBlockedDialog(false);
                onBlockedOverride?.();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-override-blocked"
            >
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
