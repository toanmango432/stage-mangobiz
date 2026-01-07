import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIBadge } from "@/components/ui/ai-badge";
import { Plus } from "lucide-react";
import { fetchAIUpsells } from "@/lib/api/ai";
import { AIUpsell } from "@/types/ai";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface AIUpsellsProps {
  cartItems: any[];
}

export function AIUpsells({ cartItems }: AIUpsellsProps) {
  const [upsells, setUpsells] = useState<AIUpsell[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    async function loadUpsells() {
      setIsLoading(true);
      try {
        const results = await fetchAIUpsells(cartItems);
        setUpsells(results);
      } catch (error) {
        console.error('Failed to load AI upsells:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (cartItems.length > 0) {
      loadUpsells();
    }
  }, [cartItems]);

  const handleAddUpsell = (upsell: AIUpsell) => {
    addToCart({
      id: upsell.itemId,
      type: 'product',
      name: upsell.title,
      price: upsell.price,
      quantity: 1,
    });
    
    toast({
      title: "Added to cart",
      description: `${upsell.title} has been added to your cart.`,
    });

    // Remove from upsells list
    setUpsells(prev => prev.filter(u => u.id !== upsell.id));
  };

  if (isLoading || upsells.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Complete Your Look</h3>
        <AIBadge variant="chip" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upsells.map((upsell) => (
          <Card key={upsell.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {upsell.image && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={upsell.image} 
                      alt={upsell.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1">{upsell.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {upsell.description}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                    {upsell.reason}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm">${upsell.price.toFixed(2)}</span>
                      {upsell.savingsAmount && (
                        <span className="text-xs text-green-600 ml-2">
                          Save ${upsell.savingsAmount}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAddUpsell(upsell)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add
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
}
