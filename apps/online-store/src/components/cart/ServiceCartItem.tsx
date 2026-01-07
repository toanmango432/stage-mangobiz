import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar, Clock, User } from "lucide-react";
import { CartItem } from "@/types/cart";
import { useCart } from "@/contexts/CartContext";

interface ServiceCartItemProps {
  item: CartItem;
}

export const ServiceCartItem = ({ item }: ServiceCartItemProps) => {
  const { removeFromCart } = useCart();
  
  const addOnsTotal = item.serviceDetails?.addOns?.reduce(
    (sum, addOn) => sum + addOn.price,
    0
  ) || 0;
  
  const total = item.price + addOnsTotal;

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <Badge variant="secondary" className="mt-1">Service Booking</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFromCart(item.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {item.serviceDetails && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{item.serviceDetails.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{item.serviceDetails.time} ({item.serviceDetails.duration} min)</span>
                </div>
                {item.serviceDetails.staff && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{item.serviceDetails.staff}</span>
                  </div>
                )}
              </div>
            )}
            
            {item.serviceDetails?.addOns && item.serviceDetails.addOns.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Add-ons:</p>
                <ul className="text-sm space-y-1">
                  {item.serviceDetails.addOns.map((addOn, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">• {addOn.name}</span>
                      <span>+${addOn.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
