import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StockChange } from "@/types/api";

interface StockWarningProps {
  changes: StockChange[];
  onAccept: () => void;
  onReview: () => void;
}

export const StockWarning = ({ changes, onAccept, onReview }: StockWarningProps) => {
  if (changes.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-medium">Some items in your cart have changed:</p>
          
          <div className="space-y-2">
            {changes.map((change, index) => (
              <div key={index} className="text-sm bg-background/50 rounded p-2">
                <p className="font-medium">{change.itemName}</p>
                
                {change.oldPrice !== change.newPrice && (
                  <p className="text-muted-foreground">
                    Price: <span className="line-through">${change.oldPrice.toFixed(2)}</span> → ${change.newPrice.toFixed(2)}
                  </p>
                )}
                
                {!change.available && (
                  <p className="text-destructive font-medium">Currently unavailable</p>
                )}
                
                {change.oldStock !== undefined && change.newStock !== undefined && (
                  <p className="text-muted-foreground">
                    Stock: {change.oldStock} → {change.newStock} remaining
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={onReview} variant="outline" size="sm">
              Review Cart
            </Button>
            <Button onClick={onAccept} size="sm">
              Accept Changes
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
