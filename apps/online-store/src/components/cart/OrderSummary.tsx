import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";

interface OrderSummaryProps {
  showPromoCode?: boolean;
}

export const OrderSummary = ({ showPromoCode = true }: OrderSummaryProps) => {
  const { getCartTotal, promoCode } = useCart();
  const summary = getCartTotal();

  return (
    <Card className="shadow-card">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">Order Summary</h2>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${summary.subtotal.toFixed(2)}</span>
          </div>
          
          {summary.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {promoCode && `(${promoCode.code})`}</span>
              <span>-${summary.discount.toFixed(2)}</span>
            </div>
          )}
          
          {summary.shipping > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">${summary.shipping.toFixed(2)}</span>
            </div>
          )}
          
          {summary.shipping === 0 && summary.subtotal > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Shipping</span>
              <span>FREE</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">${summary.tax.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">${summary.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
