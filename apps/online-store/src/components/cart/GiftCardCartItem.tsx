import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Gift, Mail } from "lucide-react";
import { CartItem } from "@/types/cart";
import { useCart } from "@/contexts/CartContext";

interface GiftCardCartItemProps {
  item: CartItem;
}

export const GiftCardCartItem = ({ item }: GiftCardCartItemProps) => {
  const { removeFromCart } = useCart();

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {item.image && (
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-hero flex-shrink-0 flex items-center justify-center">
              <Gift className="h-12 w-12 text-white" />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-lg">Gift Card</h3>
                <Badge variant="secondary" className="mt-1">Digital</Badge>
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
            
            {item.giftCardDetails && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>To: {item.giftCardDetails.recipientName} ({item.giftCardDetails.recipientEmail})</span>
                </div>
                {item.giftCardDetails.message && (
                  <p className="text-sm text-muted-foreground pl-6 italic">
                    "{item.giftCardDetails.message}"
                  </p>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
