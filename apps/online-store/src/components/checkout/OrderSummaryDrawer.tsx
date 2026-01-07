import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { PromoCodeInput } from "@/components/cart/PromoCodeInput";

export const OrderSummaryDrawer = () => {
  const { items, getCartTotal, promoCode } = useCart();
  const summary = getCartTotal();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full md:hidden">
          <ShoppingBag className="h-4 w-4 mr-2" />
          View Order Summary (${summary.total.toFixed(2)})
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Order Summary</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4 overflow-y-auto max-h-[50vh]">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.name}</h4>
                {item.quantity && (
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                )}
                <p className="text-sm font-bold text-primary mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <PromoCodeInput />
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${summary.subtotal.toFixed(2)}</span>
            </div>
            {summary.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  {promoCode ? `Promo (${promoCode.code})` : 'Discount'}
                </span>
                <span>-${summary.discount.toFixed(2)}</span>
              </div>
            )}
            {summary.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">${summary.shipping.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">${summary.tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">${summary.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
