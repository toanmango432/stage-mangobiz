import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import ClientSelector, { Client } from "./ClientSelector";
import ServiceGrid, { Service } from "./ServiceGrid";
import ServiceList, { TicketService, StaffMember } from "./ServiceList";
import CheckoutSummary from "./CheckoutSummary";
import PaymentModal from "./PaymentModal";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

interface TicketWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  staffMembers: StaffMember[];
}

type WizardStep = "client" | "services" | "review" | "payment";

const STEPS: { id: WizardStep; label: string; number: number }[] = [
  { id: "client", label: "Select Client", number: 1 },
  { id: "services", label: "Add Services", number: 2 },
  { id: "review", label: "Review & Pay", number: 3 },
];

export default function TicketWizard({
  open,
  onClose,
  onComplete,
  staffMembers,
}: TicketWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("client");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [services, setServices] = useState<TicketService[]>([]);
  const [discount, setDiscount] = useState(0);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleCreateClient = (newClient: Partial<Client>) => {
    const client: Client = {
      id: Math.random().toString(),
      firstName: newClient.firstName || "",
      lastName: newClient.lastName || "",
      phone: newClient.phone || "",
      email: newClient.email,
    };
    setSelectedClient(client);
  };

  const handleAddService = (service: Service) => {
    const ticketService: TicketService = {
      id: Math.random().toString(),
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      duration: service.duration,
      status: "not_started",
    };
    setServices([...services, ticketService]);
  };

  const handleUpdateService = (
    serviceId: string,
    updates: Partial<TicketService>
  ) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
    );
  };

  const handleRemoveService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  const subtotal = services.reduce((sum, s) => sum + s.price, 0);
  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * 0.085;
  const total = discountedSubtotal + tax;

  const handleApplyDiscount = (data: {
    type: "percentage" | "fixed";
    amount: number;
    reason: string;
  }) => {
    const discountValue =
      data.type === "percentage" ? (subtotal * data.amount) / 100 : data.amount;
    setDiscount(discountValue);
    setHasDiscount(true);
  };

  const handleRemoveDiscount = () => {
    setDiscount(0);
    setHasDiscount(false);
  };

  const handleNext = () => {
    if (currentStep === "client") {
      setCurrentStep("services");
    } else if (currentStep === "services") {
      setCurrentStep("review");
    } else if (currentStep === "review") {
      setShowPaymentModal(true);
    }
  };

  const handleBack = () => {
    if (currentStep === "review") {
      setCurrentStep("services");
    } else if (currentStep === "services") {
      setCurrentStep("client");
    }
  };

  const handleCompletePayment = (payment: any) => {
    console.log("Payment completed:", { selectedClient, services, payment });
    setShowPaymentModal(false);
    onComplete();
    handleReset();
  };

  const handleReset = () => {
    setCurrentStep("client");
    setSelectedClient(null);
    setServices([]);
    setDiscount(0);
    setHasDiscount(false);
  };

  const canProceed = () => {
    if (currentStep === "client") return true;
    if (currentStep === "services") return services.length > 0;
    if (currentStep === "review") return services.length > 0 && total > 0;
    return false;
  };

  const currentStepNumber = STEPS.find((s) => s.id === currentStep)?.number || 1;
  const progress = ((currentStepNumber - 1) / (STEPS.length - 1)) * 100;

  const getClientDisplay = () => {
    if (selectedClient) {
      return `${selectedClient.firstName} ${selectedClient.lastName}`;
    }
    return "Walk-in";
  };

  return (
    <>
      <Dialog open={open && !showPaymentModal} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Ticket</DialogTitle>
            <DialogDescription>
              Step {currentStepNumber} of {STEPS.length}:{" "}
              {STEPS.find((s) => s.id === currentStep)?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Progress value={progress} className="h-2" />

            <div className="flex gap-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 px-3 py-2 rounded-md border text-center transition-colors ${
                    step.number < currentStepNumber
                      ? "bg-primary text-primary-foreground border-primary"
                      : step.id === currentStep
                      ? "bg-accent border-accent-foreground/20"
                      : "bg-muted/50 border-border"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {step.number < currentStepNumber ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6">
            {currentStep === "client" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Who is this ticket for?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Search for an existing client or create a new one. You can also
                    proceed without selecting a client for walk-ins.
                  </p>
                </div>
                <ClientSelector
                  selectedClient={selectedClient}
                  onSelectClient={setSelectedClient}
                  onCreateClient={handleCreateClient}
                />
                {selectedClient && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-md text-center">
                    <p className="text-sm font-medium">
                      Client selected: {getClientDisplay()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentStep === "services" && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    What services are included?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select services from the catalog. You can add multiple services
                    and assign staff to each one.
                  </p>
                </div>

                {services.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Added Services</h4>
                      <Badge variant="secondary">
                        {services.length} service{services.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <ServiceList
                      services={services}
                      staffMembers={staffMembers}
                      onUpdateService={handleUpdateService}
                      onRemoveService={handleRemoveService}
                    />
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Add More Services</h4>
                  <ServiceGrid onAddServices={(services) => services.forEach(s => handleAddService(s))} />
                </div>
              </div>
            )}

            {currentStep === "review" && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Review your ticket
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verify the details and proceed to payment when ready.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Client Information</h4>
                      <div className="p-4 bg-muted/50 rounded-md">
                        <p className="font-medium">{getClientDisplay()}</p>
                        {selectedClient?.phone && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedClient.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Services</h4>
                      <div className="space-y-2">
                        {services.map((service) => (
                          <div
                            key={service.id}
                            className="p-3 bg-muted/50 rounded-md flex justify-between items-start"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {service.serviceName}
                              </p>
                              {service.staffName && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  with {service.staffName}
                                </p>
                              )}
                            </div>
                            <p className="font-medium">${service.price}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <CheckoutSummary
                      subtotal={subtotal}
                      tax={tax}
                      discount={discount}
                      total={total}
                      onApplyDiscount={handleApplyDiscount}
                      onRemoveDiscount={handleRemoveDiscount}
                      onCheckout={() => {}}
                      hasDiscount={hasDiscount}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex gap-3">
            {currentStep !== "client" && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 gap-2"
              data-testid="button-next"
            >
              {currentStep === "review" ? "Proceed to Payment" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onComplete={handleCompletePayment}
        staffMembers={staffMembers.map((s) => ({ id: s.id, name: s.name }))}
      />
    </>
  );
}
