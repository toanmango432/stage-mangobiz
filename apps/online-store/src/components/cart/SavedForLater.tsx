import { ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

export const SavedForLater = () => {
  const { savedForLater, moveToCart, removeFromSaved } = useCart();

  if (savedForLater.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Saved for Later ({savedForLater.length})</h2>
      <div className="grid gap-4">
        {savedForLater.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium mb-1">{item.name}</h3>
                  <p className="text-lg font-semibold text-primary mb-3">
                    ${item.price.toFixed(2)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        moveToCart(item.id);
                        toast.success('Moved to cart');
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Move to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        removeFromSaved(item.id);
                        toast.success('Removed from saved items');
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
