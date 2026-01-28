'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { CartItemCard } from "@/components/cart/CartItemCard";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { PromoCodeInput } from "@/components/cart/PromoCodeInput";
import { EmptyCartRecommendations } from "@/components/cart/EmptyCartRecommendations";
import { SavedForLater } from "@/components/cart/SavedForLater";
import { GiftWrapOption } from "@/components/cart/GiftWrapOption";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

const Cart = () => {
  const { items, getCartItemCount, getCartTotal } = useCart();
  const router = useRouter();
  const itemCount = getCartItemCount();
  const summary = getCartTotal();
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  
  // Free shipping progress
  const freeShippingThreshold = 50;
  const progress = Math.min((summary.subtotal / freeShippingThreshold) * 100, 100);
  const remaining = Math.max(freeShippingThreshold - summary.subtotal, 0);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            Shopping Cart {itemCount > 0 && `(${itemCount} items)`}
          </h1>
          {items.length > 0 && (
            <Button asChild variant="outline">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyCartRecommendations />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {remaining > 0 && remaining < freeShippingThreshold && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Add ${remaining.toFixed(2)} more for FREE shipping!
                      </p>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                </Card>
              )}
              
              {items.map((item) => (
                <CartItemCard key={`${item.type}-${item.id}`} item={item} />
              ))}
              
              {/* Gift Wrap Option */}
              <GiftWrapOption
                enabled={giftWrap}
                message={giftMessage}
                onEnabledChange={setGiftWrap}
                onMessageChange={setGiftMessage}
              />
              
              {/* Saved for Later */}
              <div className="mt-8">
                <SavedForLater />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <OrderSummary />
                
                <Card className="shadow-card">
                  <CardContent className="p-4 space-y-4">
                    <PromoCodeInput />
                    
                    <Button 
                      onClick={handleCheckout}
                      className="w-full h-12 bg-primary hover:bg-primary-dark"
                    >
                      Proceed to Checkout
                    </Button>

                    <div className="text-xs text-center text-muted-foreground">
                      🔒 Secure checkout
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
