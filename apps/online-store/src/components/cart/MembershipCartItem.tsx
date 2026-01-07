import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Crown } from "lucide-react";
import { CartItem } from "@/types/cart";
import { useCart } from "@/contexts/CartContext";

interface MembershipCartItemProps {
  item: CartItem;
}

export const MembershipCartItem = ({ item }: MembershipCartItemProps) => {
  const { removeFromCart } = useCart();

  const getBillingPeriod = () => {
    if (!item.membershipDetails) return 'month';
    switch (item.membershipDetails.billingCycle) {
      case 'monthly': return 'month';
      case 'quarterly': return 'quarter';
      case 'yearly': return 'year';
      default: return 'month';
    }
  };

  return (
    <Card className="shadow-card border-primary/20">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                </div>
                <Badge className="mt-1 bg-primary">Membership</Badge>
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
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-primary">${item.price.toFixed(2)}</span>
              <span className="text-muted-foreground">/ {getBillingPeriod()}</span>
            </div>
            
            {item.membershipDetails?.startDate && (
              <p className="text-sm text-muted-foreground mb-2">
                Starts: {item.membershipDetails.startDate}
              </p>
            )}
            
            <p className="text-sm text-muted-foreground">
              Your membership will auto-renew each billing period
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
