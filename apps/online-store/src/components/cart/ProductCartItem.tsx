import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus } from "lucide-react";
import { CartItem } from "@/types/cart";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

interface ProductCartItemProps {
  item: CartItem;
}

export const ProductCartItem = ({ item }: ProductCartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();
  const quantity = item.quantity || 1;
  const itemTotal = item.price * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {item.image && (
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold line-clamp-2">{item.name}</h3>
                {item.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                )}
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
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-16 h-8 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  ${item.price.toFixed(2)} each
                </div>
                <div className="text-lg font-bold text-primary">
                  ${itemTotal.toFixed(2)}
                </div>
              </div>
            </div>
            
            {item.inStock === false && (
              <Badge variant="destructive" className="mt-2">Out of Stock</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
