import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, DollarSign, Percent, Tag } from "lucide-react";

interface SummaryDialogsProps {
  // Bulk delete dialog
  showBulkDeleteConfirm: boolean;
  setShowBulkDeleteConfirm: (value: boolean) => void;
  pendingBulkDeleteIds: string[];
  setPendingBulkDeleteIds: (ids: string[]) => void;
  onConfirmBulkDelete: () => void;

  // Price edit dialog
  showPriceEditDialog: boolean;
  setShowPriceEditDialog: (value: boolean) => void;
  pendingEditServiceIds: string[];
  setPendingEditServiceIds: (ids: string[]) => void;
  newPriceValue: string;
  setNewPriceValue: (value: string) => void;
  onConfirmPriceEdit: () => void;

  // Service discount dialog
  showServiceDiscountDialog: boolean;
  setShowServiceDiscountDialog: (value: boolean) => void;
  serviceDiscountValue: string;
  setServiceDiscountValue: (value: string) => void;
  serviceDiscountType: "percentage" | "fixed";
  setServiceDiscountType: (type: "percentage" | "fixed") => void;
  onConfirmServiceDiscount: () => void;

  // Ticket discount dialog
  showTicketDiscountDialog: boolean;
  setShowTicketDiscountDialog: (value: boolean) => void;
  ticketDiscountValue: string;
  setTicketDiscountValue: (value: string) => void;
  ticketDiscountType: "percentage" | "fixed";
  setTicketDiscountType: (type: "percentage" | "fixed") => void;
  ticketDiscountReason: string;
  setTicketDiscountReason: (reason: string) => void;
  onConfirmTicketDiscount: () => void;
}

/**
 * Summary dialogs for bulk operations and discounts.
 * Extracted from InteractiveSummary for better organization.
 */
export function SummaryDialogs({
  // Bulk delete
  showBulkDeleteConfirm,
  setShowBulkDeleteConfirm,
  pendingBulkDeleteIds,
  setPendingBulkDeleteIds,
  onConfirmBulkDelete,
  // Price edit
  showPriceEditDialog,
  setShowPriceEditDialog,
  pendingEditServiceIds,
  setPendingEditServiceIds,
  newPriceValue,
  setNewPriceValue,
  onConfirmPriceEdit,
  // Service discount
  showServiceDiscountDialog,
  setShowServiceDiscountDialog,
  serviceDiscountValue,
  setServiceDiscountValue,
  serviceDiscountType,
  setServiceDiscountType,
  onConfirmServiceDiscount,
  // Ticket discount
  showTicketDiscountDialog,
  setShowTicketDiscountDialog,
  ticketDiscountValue,
  setTicketDiscountValue,
  ticketDiscountType,
  setTicketDiscountType,
  ticketDiscountReason,
  setTicketDiscountReason,
  onConfirmTicketDiscount,
}: SummaryDialogsProps) {
  return (
    <>
      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent data-testid="dialog-bulk-delete">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Delete Multiple Services?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {pendingBulkDeleteIds.length} service(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowBulkDeleteConfirm(false);
                setPendingBulkDeleteIds([]);
              }}
              data-testid="button-cancel-bulk-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-bulk-delete"
            >
              Delete {pendingBulkDeleteIds.length} Services
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Price Edit Dialog */}
      <Dialog open={showPriceEditDialog} onOpenChange={setShowPriceEditDialog}>
        <DialogContent className="sm:max-w-[400px]" data-testid="dialog-price-edit">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Edit Price
            </DialogTitle>
            <DialogDescription>
              Set a new price for {pendingEditServiceIds.length} service(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-price">New Price ($)</Label>
            <Input
              id="new-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={newPriceValue}
              onChange={(e) => setNewPriceValue(e.target.value)}
              className="mt-2"
              autoFocus
              data-testid="input-new-price"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPriceEditDialog(false);
                setPendingEditServiceIds([]);
                setNewPriceValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmPriceEdit}
              disabled={!newPriceValue || isNaN(parseFloat(newPriceValue))}
              data-testid="button-confirm-price"
            >
              Update Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service-Level Discount Dialog */}
      <Dialog open={showServiceDiscountDialog} onOpenChange={setShowServiceDiscountDialog}>
        <DialogContent className="sm:max-w-[400px]" data-testid="dialog-service-discount">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Apply Service Discount
            </DialogTitle>
            <DialogDescription>
              Add a discount to {pendingEditServiceIds.length} service(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Discount Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={serviceDiscountType === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setServiceDiscountType("percentage")}
                  className="flex-1"
                  data-testid="button-service-discount-percent"
                >
                  <Percent className="h-4 w-4 mr-1" />
                  Percentage
                </Button>
                <Button
                  variant={serviceDiscountType === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setServiceDiscountType("fixed")}
                  className="flex-1"
                  data-testid="button-service-discount-fixed"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Fixed Amount
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="service-discount-value">
                {serviceDiscountType === "percentage" ? "Discount (%)" : "Discount Amount ($)"}
              </Label>
              <Input
                id="service-discount-value"
                type="number"
                min="0"
                step={serviceDiscountType === "percentage" ? "1" : "0.01"}
                max={serviceDiscountType === "percentage" ? "100" : undefined}
                placeholder={serviceDiscountType === "percentage" ? "10" : "5.00"}
                value={serviceDiscountValue}
                onChange={(e) => setServiceDiscountValue(e.target.value)}
                className="mt-2"
                autoFocus
                data-testid="input-service-discount-value"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowServiceDiscountDialog(false);
                setPendingEditServiceIds([]);
                setServiceDiscountValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmServiceDiscount}
              disabled={!serviceDiscountValue || isNaN(parseFloat(serviceDiscountValue)) || parseFloat(serviceDiscountValue) <= 0}
              data-testid="button-confirm-service-discount"
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket-Level Discount Dialog */}
      <Dialog open={showTicketDiscountDialog} onOpenChange={setShowTicketDiscountDialog}>
        <DialogContent className="sm:max-w-[400px]" data-testid="dialog-ticket-discount">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Add Ticket Discount
            </DialogTitle>
            <DialogDescription>
              Apply a discount to the entire ticket
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Discount Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={ticketDiscountType === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTicketDiscountType("percentage")}
                  className="flex-1"
                  data-testid="button-ticket-discount-percent"
                >
                  <Percent className="h-4 w-4 mr-1" />
                  Percentage
                </Button>
                <Button
                  variant={ticketDiscountType === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTicketDiscountType("fixed")}
                  className="flex-1"
                  data-testid="button-ticket-discount-fixed"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Fixed Amount
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="ticket-discount-value">
                {ticketDiscountType === "percentage" ? "Discount (%)" : "Discount Amount ($)"}
              </Label>
              <Input
                id="ticket-discount-value"
                type="number"
                min="0"
                step={ticketDiscountType === "percentage" ? "1" : "0.01"}
                max={ticketDiscountType === "percentage" ? "100" : undefined}
                placeholder={ticketDiscountType === "percentage" ? "10" : "5.00"}
                value={ticketDiscountValue}
                onChange={(e) => setTicketDiscountValue(e.target.value)}
                className="mt-2"
                autoFocus
                data-testid="input-ticket-discount-value"
              />
            </div>
            <div>
              <Label htmlFor="ticket-discount-reason">Reason (optional)</Label>
              <Input
                id="ticket-discount-reason"
                type="text"
                placeholder="e.g., Loyalty, First visit, Promotion"
                value={ticketDiscountReason}
                onChange={(e) => setTicketDiscountReason(e.target.value)}
                className="mt-2"
                data-testid="input-ticket-discount-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTicketDiscountDialog(false);
                setTicketDiscountValue("");
                setTicketDiscountReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmTicketDiscount}
              disabled={!ticketDiscountValue || isNaN(parseFloat(ticketDiscountValue)) || parseFloat(ticketDiscountValue) <= 0}
              data-testid="button-confirm-ticket-discount"
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
