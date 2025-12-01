import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scissors, DollarSign, Clock, User, AlertCircle, ArrowRight } from "lucide-react";
import { TicketService } from "./ServiceList";
import { Client } from "./ClientSelector";

interface SplitTicketDialogProps {
  open: boolean;
  onClose: () => void;
  services: TicketService[];
  client: Client | null;
  subtotal: number;
  tax: number;
  discount: number;
  onSplit: (serviceIds: string[], keepClient: boolean) => void;
}

export default function SplitTicketDialog({
  open,
  onClose,
  services,
  client,
  subtotal,
  tax,
  discount,
  onSplit,
}: SplitTicketDialogProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [keepClientForNewTicket, setKeepClientForNewTicket] = useState(true);

  const toggleService = (serviceId: string) => {
    const newSelection = new Set(selectedServiceIds);
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId);
    } else {
      newSelection.add(serviceId);
    }
    setSelectedServiceIds(newSelection);
  };

  const selectAll = () => {
    setSelectedServiceIds(new Set(services.map(s => s.id)));
  };

  const clearSelection = () => {
    setSelectedServiceIds(new Set());
  };

  // Calculate split preview
  const selectedServices = services.filter(s => selectedServiceIds.has(s.id));
  const remainingServices = services.filter(s => !selectedServiceIds.has(s.id));

  const selectedSubtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const remainingSubtotal = remainingServices.reduce((sum, s) => sum + s.price, 0);

  // Proportional discount distribution
  const selectedDiscountPortion = subtotal > 0 ? (selectedSubtotal / subtotal) * discount : 0;
  const remainingDiscountPortion = discount - selectedDiscountPortion;

  // Proportional tax distribution (based on discounted taxable base)
  const selectedAfterDiscount = selectedSubtotal - selectedDiscountPortion;
  const remainingAfterDiscount = remainingSubtotal - remainingDiscountPortion;
  
  // Tax was calculated on the discounted subtotal, so we must apportion from that base
  const taxable = subtotal - discount;
  const selectedTax = taxable > 0 ? tax * (selectedAfterDiscount / taxable) : 0;
  const remainingTax = taxable > 0 ? tax * (remainingAfterDiscount / taxable) : 0;

  const selectedTotal = selectedAfterDiscount + selectedTax;
  const remainingTotal = remainingAfterDiscount + remainingTax;

  const canSplit = selectedServiceIds.size > 0 && selectedServiceIds.size < services.length;

  const handleSplit = () => {
    if (canSplit) {
      onSplit(Array.from(selectedServiceIds), keepClientForNewTicket);
      setSelectedServiceIds(new Set());
      setKeepClientForNewTicket(true);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedServiceIds(new Set());
    setKeepClientForNewTicket(true);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <DialogTitle>Split Ticket</DialogTitle>
          </div>
          <DialogDescription>
            Select services to move to a new ticket. The original ticket will keep the remaining services.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Discounts and taxes will be distributed proportionally between both tickets based on service amounts.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex-1 overflow-hidden px-4 sm:px-6">
          {/* Service Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">
                Select Services ({selectedServiceIds.size} of {services.length} selected)
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedServiceIds.size === services.length}
                  data-testid="button-select-all"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedServiceIds.size === 0}
                  data-testid="button-clear-selection"
                >
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[200px] border rounded-md">
              <div className="p-3 space-y-2">
                {services.map((service) => {
                  const isSelected = selectedServiceIds.has(service.id);
                  return (
                    <div
                      key={service.id}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors hover-elevate ${
                        isSelected ? 'bg-primary/10 border-primary' : 'bg-card'
                      }`}
                      onClick={() => toggleService(service.id)}
                      data-testid={`service-split-${service.id}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleService(service.id)}
                        data-testid={`checkbox-service-${service.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{service.serviceName}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {service.staffName && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{service.staffName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{service.duration}m</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        <span>${service.price.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Client Assignment for New Ticket */}
          {client && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm mb-2">New Ticket Client</h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="keep-client"
                  checked={keepClientForNewTicket}
                  onCheckedChange={(checked) => setKeepClientForNewTicket(checked as boolean)}
                  data-testid="checkbox-keep-client"
                />
                <label htmlFor="keep-client" className="text-sm cursor-pointer">
                  Assign same client ({client.firstName} {client.lastName}) to new ticket
                </label>
              </div>
              {!keepClientForNewTicket && (
                <p className="text-xs text-muted-foreground mt-2 ml-6">
                  New ticket will be created without a client. You can assign one later.
                </p>
              )}
            </div>
          )}

          {/* Split Preview */}
          {canSplit && (
            <>
              <Separator className="my-4" />
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-3">Split Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* New Ticket */}
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="default" className="text-xs">New Ticket</Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedServiceIds.size} service{selectedServiceIds.size !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">${selectedSubtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Discount</span>
                          <span>-${selectedDiscountPortion.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">${selectedTax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span>${selectedTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Remaining Ticket */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">Original Ticket</Badge>
                      <span className="text-xs text-muted-foreground">
                        {remainingServices.length} service{remainingServices.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">${remainingSubtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Discount</span>
                          <span>-${remainingDiscountPortion.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">${remainingTax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span>${remainingTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-split"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSplit}
            disabled={!canSplit}
            className="gap-2"
            data-testid="button-confirm-split"
          >
            <Scissors className="h-4 w-4" />
            Split Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
