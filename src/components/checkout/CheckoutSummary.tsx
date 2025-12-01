import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Tag, Percent, ChevronUp } from "lucide-react";

export interface CheckoutSummaryProps {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  onApplyDiscount: (discount: { type: "percentage" | "fixed"; amount: number; reason: string }) => void;
  onRemoveDiscount: () => void;
  onCheckout: () => void;
  hasDiscount: boolean;
}

export default function CheckoutSummary({
  subtotal,
  tax,
  discount,
  total,
  onApplyDiscount,
  onRemoveDiscount,
  onCheckout,
  hasDiscount,
}: CheckoutSummaryProps) {
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  
  const DISCOUNT_PRESETS = [
    { label: "10% Off", type: "percentage" as const, amount: 10, reason: "10% Discount" },
    { label: "15% Off", type: "percentage" as const, amount: 15, reason: "15% Discount" },
    { label: "20% Off", type: "percentage" as const, amount: 20, reason: "20% Discount" },
    { label: "Senior", type: "percentage" as const, amount: 15, reason: "Senior Discount" },
    { label: "Employee", type: "percentage" as const, amount: 25, reason: "Employee Discount" },
    { label: "$10 Off", type: "fixed" as const, amount: 10, reason: "$10 Discount" },
  ];

  const handleApplyDiscount = () => {
    const amount = parseFloat(discountAmount);
    if (amount > 0) {
      onApplyDiscount({
        type: discountType,
        amount,
        reason: discountReason.trim() || `${discountType === "percentage" ? amount + "%" : "$" + amount} Discount`,
      });
      setShowDiscountForm(false);
      setDiscountAmount("");
      setDiscountReason("");
      setSelectedPreset(null);
      console.log("Discount applied:", { discountType, amount, discountReason });
    }
  };
  
  const handlePresetClick = (preset: typeof DISCOUNT_PRESETS[0]) => {
    setDiscountType(preset.type);
    setDiscountAmount(preset.amount.toString());
    setDiscountReason(preset.reason);
    setSelectedPreset(preset.label);
  };
  
  const calculatePreview = () => {
    const amount = parseFloat(discountAmount);
    if (!amount || amount <= 0) return null;
    
    const discountValue = discountType === "percentage" ? (subtotal * amount) / 100 : amount;
    const newSubtotal = subtotal - discountValue;
    
    // Derive effective tax rate from actual props (handle zero subtotal edge case)
    const effectiveTaxRate = subtotal > 0 ? tax / subtotal : 0;
    const newTax = newSubtotal * effectiveTaxRate;
    const newTotal = newSubtotal + newTax;
    
    return {
      discount: discountValue,
      newTotal,
      savings: total - newTotal
    };
  };
  
  const preview = calculatePreview();

  return (
    <>
      {/* Mobile Compact Sticky Footer */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50">
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSheet(true)}
              className="flex items-center gap-1.5 px-2"
              data-testid="button-show-summary-mobile"
            >
              <ChevronUp className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="font-bold text-base" data-testid="text-total-mobile">
                  ${total.toFixed(2)}
                </span>
              </div>
            </Button>
            <Button
              className="h-11 px-6 flex-shrink-0"
              onClick={onCheckout}
              disabled={total <= 0}
              data-testid="button-checkout-mobile"
            >
              Complete
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Summary Sheet */}
      <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Order Summary</SheetTitle>
            <SheetDescription>
              Review your order details and apply discounts
            </SheetDescription>
          </SheetHeader>
          
          <div className="overflow-y-auto h-[calc(85vh-80px)] p-4">
            <div className="space-y-4">
              {/* Summary Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium" data-testid="text-subtotal-mobile">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {hasDiscount && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-green-600 dark:text-green-400">Discount</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-600 dark:text-green-400" data-testid="text-discount-mobile">
                        -${discount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRemoveDiscount}
                        className="h-6 px-2 text-xs"
                        data-testid="button-remove-discount-mobile"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax {subtotal > 0 ? `(${((tax / subtotal) * 100).toFixed(1)}%)` : ''}
                  </span>
                  <span className="font-medium" data-testid="text-tax-mobile">
                    ${tax.toFixed(2)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-bold text-2xl" data-testid="text-total-sheet">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Discount Controls - Same as desktop */}
              {!hasDiscount && !showDiscountForm && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setShowDiscountForm(true)}
                  data-testid="button-add-discount-mobile"
                >
                  <Tag className="h-4 w-4" />
                  Add Discount
                </Button>
              )}

              {showDiscountForm && (
                <div className="p-4 bg-muted/50 rounded-md space-y-3">
                  {/* Discount Presets */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quick Discounts</label>
                    <div className="grid grid-cols-3 gap-2">
                      {DISCOUNT_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          variant={selectedPreset === preset.label ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetClick(preset)}
                          className="h-9"
                          data-testid={`button-preset-mobile-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Type</label>
                    <Select
                      value={discountType}
                      onValueChange={(value: "percentage" | "fixed") =>
                        setDiscountType(value)
                      }
                    >
                      <SelectTrigger data-testid="select-discount-type-mobile">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Amount</label>
                    <Input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => {
                        setDiscountAmount(e.target.value);
                        setSelectedPreset(null);
                      }}
                      placeholder={discountType === "percentage" ? "10" : "15.00"}
                      data-testid="input-discount-amount-mobile"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Reason <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="e.g., First-time client, Loyalty reward"
                      data-testid="input-discount-reason-mobile"
                    />
                  </div>
                  
                  {/* Discount Preview */}
                  {preview && (
                    <Card className="p-3 bg-green-500/5 border-green-500/20">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Discount Amount</span>
                          <span className="font-semibold text-green-600 dark:text-green-500">
                            -${preview.discount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">New Total</span>
                          <span className="font-semibold">${preview.newTotal.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-600 dark:text-green-500">You Save</span>
                          <Badge variant="outline" className="text-green-600 dark:text-green-500 border-green-500/20">
                            ${preview.savings.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => {
                        handleApplyDiscount();
                        setShowMobileSheet(false);
                      }}
                      className="flex-1"
                      disabled={!discountAmount}
                      data-testid="button-apply-discount-mobile"
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDiscountForm(false);
                        setDiscountAmount("");
                        setDiscountReason("");
                      }}
                      data-testid="button-cancel-discount-mobile"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Full Card - Hidden on Mobile */}
      <Card className="hidden sm:block p-4 sm:p-6 sticky top-4">
        <h3 className="font-semibold text-lg mb-3 sm:mb-4">Summary</h3>
        
        <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium" data-testid="text-subtotal">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        {hasDiscount && (
          <div className="flex justify-between text-sm items-center">
            <span className="text-green-600 dark:text-green-400">Discount</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-600 dark:text-green-400" data-testid="text-discount">
                -${discount.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemoveDiscount}
                className="h-6 px-2 text-xs"
                data-testid="button-remove-discount"
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Tax {subtotal > 0 ? `(${((tax / subtotal) * 100).toFixed(1)}%)` : ''}
          </span>
          <span className="font-medium" data-testid="text-tax">
            ${tax.toFixed(2)}
          </span>
        </div>

        <Separator />

        <div className="flex justify-between">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-bold text-2xl" data-testid="text-total">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {!hasDiscount && !showDiscountForm && (
        <Button
          variant="outline"
          className="w-full mt-4 gap-2"
          onClick={() => setShowDiscountForm(true)}
          data-testid="button-add-discount"
        >
          <Tag className="h-4 w-4" />
          Add Discount
        </Button>
      )}

      {showDiscountForm && (
        <div className="mt-4 p-4 bg-muted/50 rounded-md space-y-3">
          {/* Discount Presets */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Discounts</label>
            <div className="grid grid-cols-3 gap-2">
              {DISCOUNT_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant={selectedPreset === preset.label ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="h-9"
                  data-testid={`button-preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">Type</label>
            <Select
              value={discountType}
              onValueChange={(value: "percentage" | "fixed") =>
                setDiscountType(value)
              }
            >
              <SelectTrigger data-testid="select-discount-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Amount</label>
            <Input
              type="number"
              value={discountAmount}
              onChange={(e) => {
                setDiscountAmount(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder={discountType === "percentage" ? "10" : "15.00"}
              data-testid="input-discount-amount"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Reason <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="e.g., First-time client, Loyalty reward"
              data-testid="input-discount-reason"
            />
          </div>
          
          {/* Discount Preview */}
          {preview && (
            <Card className="p-3 bg-green-500/5 border-green-500/20">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount Amount</span>
                  <span className="font-semibold text-green-600 dark:text-green-500">
                    -${preview.discount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New Total</span>
                  <span className="font-semibold">${preview.newTotal.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600 dark:text-green-500">You Save</span>
                  <Badge variant="outline" className="text-green-600 dark:text-green-500 border-green-500/20">
                    ${preview.savings.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApplyDiscount}
              className="flex-1"
              disabled={!discountAmount}
              data-testid="button-apply-discount"
            >
              Apply
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDiscountForm(false);
                setDiscountAmount("");
                setDiscountReason("");
              }}
              data-testid="button-cancel-discount"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Button
        className="w-full mt-6 h-12 text-base"
        onClick={onCheckout}
        disabled={total <= 0}
        data-testid="button-checkout"
      >
        Complete - ${total.toFixed(2)}
      </Button>

      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => console.log("Save for later clicked")}
          data-testid="button-save-later"
        >
          Save for Later
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => console.log("Discard clicked")}
          data-testid="button-discard"
        >
          Discard
        </Button>
      </div>
      </Card>
    </>
  );
}
