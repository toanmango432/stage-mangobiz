import { Button } from "@/components/ui/button";
import { Service } from "./ServiceGrid";
import { Plus } from "lucide-react";

interface QuickServicesProps {
  onAddService: (service: Service) => void;
}

const POPULAR_SERVICES: Service[] = [
  { id: "1", name: "Haircut - Women", category: "Hair", price: 65, duration: 60 },
  { id: "2", name: "Haircut - Men", category: "Hair", price: 45, duration: 45 },
  { id: "3", name: "Color - Full", category: "Hair", price: 120, duration: 120 },
  { id: "6", name: "Manicure", category: "Nails", price: 35, duration: 30 },
  { id: "7", name: "Pedicure", category: "Nails", price: 50, duration: 45 },
  { id: "10", name: "Facial - Classic", category: "Spa", price: 85, duration: 60 },
];

export default function QuickServices({ onAddService }: QuickServicesProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Popular Services</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {POPULAR_SERVICES.map((service) => (
          <Button
            key={service.id}
            variant="outline"
            className="h-auto min-h-[60px] py-3 px-3 flex flex-col items-start gap-1 hover-elevate active-elevate-2"
            onClick={() => {
              onAddService(service);
              console.log("Quick service added:", service);
            }}
            data-testid={`button-quick-service-${service.id}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium text-sm">{service.name}</span>
              <Plus className="h-4 w-4 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
              <span>{service.duration} min</span>
              <span className="font-semibold">${service.price}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
