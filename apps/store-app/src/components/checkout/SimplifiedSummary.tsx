import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { MoreVertical, UserPlus } from "lucide-react";
import { TicketService } from "./ServiceList";
import { Client } from "./ClientSelector";

interface SimplifiedSummaryProps {
  selectedClient: Client | null;
  services: TicketService[];
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
  onAddClient: () => void;
}

export default function SimplifiedSummary({
  selectedClient,
  services,
  subtotal,
  tax,
  total,
  onCheckout,
  onAddClient,
}: SimplifiedSummaryProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Client Section */}
      <Card
        className="p-4 mb-4 hover-elevate active-elevate-2 cursor-pointer"
        onClick={onAddClient}
        data-testid="card-add-client"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-base">
              {selectedClient
                ? `${selectedClient.firstName} ${selectedClient.lastName}`
                : "Add client"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedClient
                ? selectedClient.phone || selectedClient.email
                : "Leave empty for walk-ins"}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
        </div>
      </Card>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-start justify-between border-l-4 border-primary pl-3"
            data-testid={`summary-service-${service.id}`}
          >
            <div>
              <h4 className="font-medium text-base">{service.serviceName}</h4>
              <p className="text-sm text-muted-foreground">
                {service.duration}min
                {service.staffName && ` • ${service.staffName}`}
              </p>
            </div>
            <span className="font-semibold text-base">${service.price}</span>
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No services added yet</p>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {services.length > 0 && (
        <>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium" data-testid="text-summary-subtotal">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium" data-testid="text-summary-tax">
                ${tax.toFixed(2)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="font-semibold text-base">Total</span>
              <span className="font-bold text-xl" data-testid="text-summary-total">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* To Pay Section */}
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-base">To pay</span>
            <span className="font-bold text-xl" data-testid="text-to-pay">
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Payment Button */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              data-testid="button-more-options"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            <Button
              className="flex-1 h-12 text-base bg-foreground text-background hover:bg-foreground/90"
              onClick={onCheckout}
              disabled={total <= 0}
              data-testid="button-continue-payment"
            >
              Continue to payment
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
