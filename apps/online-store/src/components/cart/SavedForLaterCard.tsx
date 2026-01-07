import { CartItem } from "@/types/cart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";

interface SavedForLaterCardProps {
  item: CartItem;
  onMoveToCart: (id: string) => void;
  onRemove: (id: string) => void;
}

export const SavedForLaterCard = ({ item, onMoveToCart, onRemove }: SavedForLaterCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className="w-20 h-20 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-medium">{item.name}</h3>
          <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMoveToCart(item.id)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Move to Cart
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      </div>
    </Card>
  );
};
