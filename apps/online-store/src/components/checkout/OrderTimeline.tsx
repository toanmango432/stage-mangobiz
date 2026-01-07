import { Check, Circle, Package, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  currentStatus: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
}

const statuses = [
  { key: 'processing', label: 'Order Placed', icon: Check },
  { key: 'confirmed', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin }
];

export const OrderTimeline = ({ currentStatus }: OrderTimelineProps) => {
  // Map completed/cancelled to delivered for display
  const displayStatus = currentStatus === 'completed' ? 'delivered' : 
                        currentStatus === 'cancelled' ? 'processing' : currentStatus;
  const currentIndex = statuses.findIndex(s => s.key === displayStatus);

  return (
    <div className="py-6">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-muted" />
        <div 
          className="absolute left-8 top-8 w-0.5 bg-primary transition-all duration-500"
          style={{ height: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
        />

        {/* Status items */}
        <div className="relative space-y-6">
          {statuses.map((status, index) => {
            const Icon = status.icon;
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={status.key} className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex items-center justify-center w-16 h-16 rounded-full border-4 bg-background transition-colors",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isCompleted && "border-muted"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 pt-3">
                  <h4 className={cn(
                    "font-semibold mb-1",
                    isCurrent && "text-primary"
                  )}>
                    {status.label}
                  </h4>
                  {isCompleted && (
                    <p className="text-sm text-muted-foreground">
                      {index === 0 && "Your order has been confirmed"}
                      {index === 1 && "We're preparing your items"}
                      {index === 2 && "Your order is on the way"}
                      {index === 3 && "Your order has arrived"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
