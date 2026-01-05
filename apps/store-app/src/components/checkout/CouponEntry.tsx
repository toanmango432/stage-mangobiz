import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Ticket, X, Loader2, Check, AlertCircle } from "lucide-react";

interface AppliedCoupon {
  code: string;
  discount: number;
  discountType: "percentage" | "fixed";
  description: string;
}

interface CouponEntryProps {
  subtotal: number;
  onApplyCoupon: (coupon: AppliedCoupon) => void;
  onRemoveCoupon: () => void;
  appliedCoupon: AppliedCoupon | null;
  disabled?: boolean;
}

const MOCK_COUPONS: Record<string, Omit<AppliedCoupon, "code">> = {
  "SAVE10": {
    discount: 10,
    discountType: "percentage",
    description: "10% off your purchase",
  },
  "SAVE20": {
    discount: 20,
    discountType: "percentage",
    description: "20% off your purchase",
  },
  "WELCOME15": {
    discount: 15,
    discountType: "percentage",
    description: "15% off for new clients",
  },
  "FLAT25": {
    discount: 25,
    discountType: "fixed",
    description: "$25 off your purchase",
  },
  "SUMMER50": {
    discount: 50,
    discountType: "fixed",
    description: "$50 off summer special",
  },
  "VIP30": {
    discount: 30,
    discountType: "percentage",
    description: "30% VIP discount",
  },
};

export default function CouponEntry({
  subtotal,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
  disabled = false,
}: CouponEntryProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setIsValidating(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const normalizedCode = couponCode.trim().toUpperCase();
    const couponData = MOCK_COUPONS[normalizedCode];

    if (couponData) {
      const calculatedDiscount =
        couponData.discountType === "percentage"
          ? (subtotal * couponData.discount) / 100
          : couponData.discount;

      if (calculatedDiscount > subtotal) {
        setError("Coupon discount exceeds order total");
        setIsValidating(false);
        return;
      }

      onApplyCoupon({
        code: normalizedCode,
        ...couponData,
      });
      setCouponCode("");
      setIsExpanded(false);
    } else {
      setError("Invalid or expired coupon code");
    }

    setIsValidating(false);
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setCouponCode("");
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    const discountAmount =
      appliedCoupon.discountType === "percentage"
        ? (subtotal * appliedCoupon.discount) / 100
        : appliedCoupon.discount;

    return (
      <div 
        className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
        data-testid="container-applied-coupon"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-500/20">
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-emerald-700 dark:text-emerald-300">
                {appliedCoupon.code}
              </span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {appliedCoupon.discountType === "percentage"
                  ? `${appliedCoupon.discount}%`
                  : `$${appliedCoupon.discount}`}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              -${discountAmount.toFixed(2)} saved
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleRemoveCoupon}
          disabled={disabled}
          data-testid="button-remove-coupon"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 h-9"
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        data-testid="button-add-coupon"
      >
        <Ticket className="h-4 w-4" />
        <span className="text-sm">Add coupon code</span>
      </Button>
    );
  }

  return (
    <div className="space-y-2" data-testid="container-coupon-entry">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isValidating || disabled}
            className={`h-9 pr-8 uppercase ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
            data-testid="input-coupon-code"
            autoFocus
          />
          {couponCode && !isValidating && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-8"
              onClick={() => {
                setCouponCode("");
                setError(null);
              }}
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          size="sm"
          className="h-9 px-4"
          onClick={handleApplyCoupon}
          disabled={!couponCode.trim() || isValidating || disabled}
          data-testid="button-apply-coupon"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => {
            setIsExpanded(false);
            setCouponCode("");
            setError(null);
          }}
          disabled={isValidating}
          data-testid="button-cancel-coupon"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {error && (
        <div className="flex items-center gap-1.5 text-destructive text-xs">
          <AlertCircle className="h-3.5 w-3.5" />
          <span data-testid="text-coupon-error">{error}</span>
        </div>
      )}
    </div>
  );
}
