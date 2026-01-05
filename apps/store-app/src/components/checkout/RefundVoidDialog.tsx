import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Ban, AlertTriangle, DollarSign, CreditCard } from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

interface RefundVoidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ServiceItem[];
  total: number;
  paymentMethod?: string;
  onRefund: (data: {
    type: "full" | "partial";
    amount: number;
    reason: string;
    refundMethod: string;
    serviceIds: string[];
  }) => void;
  onVoid: (reason: string) => void;
}

const REFUND_REASONS = [
  { value: "customer_request", label: "Customer Request" },
  { value: "service_issue", label: "Service Issue" },
  { value: "wrong_charge", label: "Wrong Charge" },
  { value: "duplicate", label: "Duplicate Transaction" },
  { value: "other", label: "Other" },
];

export default function RefundVoidDialog({
  open,
  onOpenChange,
  services,
  total,
  paymentMethod = "Credit Card",
  onRefund,
  onVoid,
}: RefundVoidDialogProps) {
  const [action, setAction] = useState<"refund" | "void">("refund");
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [customAmount, setCustomAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [refundMethod, setRefundMethod] = useState("original");
  const [confirmText, setConfirmText] = useState("");

  const selectedTotal = Array.from(selectedServices).reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.price || 0);
  }, 0);

  const refundAmount =
    refundType === "full"
      ? total
      : selectedServices.size > 0
        ? selectedTotal
        : parseFloat(customAmount) || 0;

  const canSubmit =
    reasonCategory &&
    (action === "void"
      ? confirmText.toLowerCase() === "void"
      : refundAmount > 0 && refundAmount <= total);

  const handleSubmit = () => {
    if (action === "void") {
      onVoid(reasonCategory === "other" ? reason : reasonCategory);
    } else {
      onRefund({
        type: refundType,
        amount: refundAmount,
        reason: reasonCategory === "other" ? reason : reasonCategory,
        refundMethod,
        serviceIds: Array.from(selectedServices),
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setAction("refund");
    setRefundType("full");
    setSelectedServices(new Set());
    setCustomAmount("");
    setReason("");
    setReasonCategory("");
    setRefundMethod("original");
    setConfirmText("");
    onOpenChange(false);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "refund" ? (
              <>
                <RotateCcw className="h-5 w-5" />
                Process Refund
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-destructive" />
                Void Transaction
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === "refund"
              ? "Refund all or part of this transaction"
              : "Cancel this transaction entirely"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={action}
            onValueChange={(v) => setAction(v as "refund" | "void")}
            className="grid grid-cols-2 gap-2"
          >
            <Label
              htmlFor="action-refund"
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                action === "refund" ? "border-primary bg-primary/5" : "hover-elevate"
              }`}
            >
              <RadioGroupItem value="refund" id="action-refund" />
              <div>
                <div className="font-medium text-sm">Refund</div>
                <div className="text-xs text-muted-foreground">Return funds</div>
              </div>
            </Label>
            <Label
              htmlFor="action-void"
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                action === "void" ? "border-destructive bg-destructive/5" : "hover-elevate"
              }`}
            >
              <RadioGroupItem value="void" id="action-void" />
              <div>
                <div className="font-medium text-sm">Void</div>
                <div className="text-xs text-muted-foreground">Cancel entirely</div>
              </div>
            </Label>
          </RadioGroup>

          {action === "refund" && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Refund Type</Label>
                <RadioGroup
                  value={refundType}
                  onValueChange={(v) => {
                    setRefundType(v as "full" | "partial");
                    setSelectedServices(new Set());
                    setCustomAmount("");
                  }}
                  className="grid grid-cols-2 gap-2"
                >
                  <Label
                    htmlFor="type-full"
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      refundType === "full" ? "border-primary bg-primary/5" : "hover-elevate"
                    }`}
                  >
                    <RadioGroupItem value="full" id="type-full" />
                    <div>
                      <div className="font-medium text-sm">Full Refund</div>
                      <div className="text-xs text-muted-foreground">
                        ${total.toFixed(2)}
                      </div>
                    </div>
                  </Label>
                  <Label
                    htmlFor="type-partial"
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      refundType === "partial" ? "border-primary bg-primary/5" : "hover-elevate"
                    }`}
                  >
                    <RadioGroupItem value="partial" id="type-partial" />
                    <div>
                      <div className="font-medium text-sm">Partial</div>
                      <div className="text-xs text-muted-foreground">Select items</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {refundType === "partial" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Items to Refund</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                          selectedServices.has(service.id)
                            ? "border-primary bg-primary/5"
                            : "hover-elevate"
                        }`}
                        onClick={() => toggleService(service.id)}
                        data-testid={`refund-item-${service.id}`}
                      >
                        <Checkbox
                          checked={selectedServices.has(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{service.name}</div>
                        </div>
                        <span className="text-sm font-medium">
                          ${service.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Or enter a custom amount:
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={total}
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedServices(new Set());
                      }}
                      className="pl-8"
                      data-testid="input-custom-refund-amount"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Refund Method</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger data-testid="select-refund-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">
                      Original Payment ({paymentMethod})
                    </SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason</Label>
            <Select value={reasonCategory} onValueChange={setReasonCategory}>
              <SelectTrigger data-testid="select-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reasonCategory === "other" && (
              <Textarea
                placeholder="Please describe the reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
                data-testid="input-reason-description"
              />
            )}
          </div>

          {action === "void" && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm text-destructive">
                      This action cannot be undone
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Voiding will completely cancel this transaction. Type "void" to
                      confirm.
                    </div>
                    <Input
                      className="mt-2"
                      placeholder='Type "void" to confirm'
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      data-testid="input-confirm-void"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {action === "refund" && refundAmount > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Refund Amount</span>
                  <span className="text-xl font-bold">${refundAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>
                    Refund via{" "}
                    {refundMethod === "original"
                      ? paymentMethod
                      : refundMethod === "cash"
                        ? "Cash"
                        : "Store Credit"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel-refund">
            Cancel
          </Button>
          <Button
            variant={action === "void" ? "destructive" : "default"}
            disabled={!canSubmit}
            onClick={handleSubmit}
            data-testid="button-confirm-refund"
          >
            {action === "void" ? (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Void Transaction
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Process Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
