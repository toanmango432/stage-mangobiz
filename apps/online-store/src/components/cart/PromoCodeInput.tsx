import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { X, Tag } from "lucide-react";

export const PromoCodeInput = () => {
  const { promoCode, applyPromoCode, removePromoCode } = useCart();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    setTimeout(() => {
      const success = applyPromoCode(code);
      if (success) {
        toast.success("Promo code applied!");
        setCode("");
      } else {
        toast.error("Invalid promo code or minimum not met");
      }
      setIsLoading(false);
    }, 500);
  };

  const handleRemove = () => {
    removePromoCode();
    toast.success("Promo code removed");
  };

  if (promoCode) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
        <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="flex-1 text-sm font-medium text-green-700 dark:text-green-300">
          {promoCode.code} applied
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-auto p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Enter promo code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        className="flex-1"
      />
      <Button
        onClick={handleApply}
        disabled={!code.trim() || isLoading}
        variant="outline"
      >
        Apply
      </Button>
    </div>
  );
};
