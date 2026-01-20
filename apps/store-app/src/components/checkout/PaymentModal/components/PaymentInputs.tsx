/**
 * PaymentInputs Component
 * Payment method-specific input forms (card, cash, gift card, custom)
 */

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CreditCard,
  Banknote,
  Gift,
  DollarSign,
  X,
  Loader2,
} from "lucide-react";
import type { PaymentMethodType } from "../types";
import type { AppliedGiftCard } from "../../modals/GiftCardRedeemModal";

interface PaymentInputsProps {
  currentMethod: PaymentMethodType;
  remaining: number;
  cashTendered: string;
  customPaymentName: string;
  isProcessing: boolean;
  hasUnresolvedPriceChanges: boolean;
  appliedGiftCards: AppliedGiftCard[];
  quickCashAmounts: number[];
  onQuickCash: (amount: number) => void;
  onCashTenderedChange: (value: string) => void;
  onCustomPaymentNameChange: (value: string) => void;
  onAddPayment: (amount?: number) => void;
  onOpenGiftCardModal: () => void;
  onRemoveGiftCard: (code: string) => void;
}

export function PaymentInputs({
  currentMethod,
  remaining,
  cashTendered,
  customPaymentName,
  isProcessing,
  hasUnresolvedPriceChanges,
  appliedGiftCards,
  quickCashAmounts,
  onQuickCash,
  onCashTenderedChange,
  onCustomPaymentNameChange,
  onAddPayment,
  onOpenGiftCardModal,
  onRemoveGiftCard,
}: PaymentInputsProps) {
  return (
    <>
      <Separator />

      {currentMethod === "card" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full">
                <Button
                  className="w-full h-14 text-base"
                  onClick={() => onAddPayment(remaining)}
                  disabled={isProcessing || hasUnresolvedPriceChanges}
                  data-testid="button-apply-card"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  {isProcessing ? "Processing..." : `Apply $${remaining.toFixed(2)}`}
                </Button>
              </span>
            </TooltipTrigger>
            {hasUnresolvedPriceChanges && (
              <TooltipContent>
                <p>Resolve price changes first</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}

      {currentMethod === "cash" && (
        <div className="space-y-3">
          <label className="text-sm font-medium block">Cash received</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickCashAmounts.slice(0, 4).map((amount) => (
              <Button
                key={amount}
                variant={cashTendered === amount.toString() ? "default" : "outline"}
                className="h-12 sm:h-14 text-base"
                onClick={() => onQuickCash(amount)}
                data-testid={`button-quick-cash-${amount}`}
              >
                ${amount}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            placeholder="Enter amount received"
            value={cashTendered}
            onChange={(e) => onCashTenderedChange(e.target.value)}
            className="text-lg h-12"
            data-testid="input-cash-received"
          />
          {cashTendered && parseFloat(cashTendered) >= remaining && (
            <Card className="p-3 bg-green-500/10 border-green-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Change to give back</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-500" data-testid="text-change-preview">
                  ${(parseFloat(cashTendered) - remaining).toFixed(2)}
                </span>
              </div>
            </Card>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    className="w-full h-14 text-base"
                    onClick={() => onAddPayment()}
                    disabled={!cashTendered || parseFloat(cashTendered) <= 0 || hasUnresolvedPriceChanges}
                    data-testid="button-apply-cash"
                  >
                    <Banknote className="h-5 w-5 mr-2" />
                    Apply ${cashTendered ? Math.min(parseFloat(cashTendered), remaining).toFixed(2) : "0.00"}
                  </Button>
                </span>
              </TooltipTrigger>
              {hasUnresolvedPriceChanges && (
                <TooltipContent>
                  <p>Resolve price changes first</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {currentMethod === "gift_card" && (
        <div className="space-y-3">
          <label className="text-sm font-medium block">Gift Card Payment</label>

          {/* Show applied gift cards */}
          {appliedGiftCards.length > 0 && (
            <div className="space-y-2">
              {appliedGiftCards.map((gc) => (
                <Card
                  key={gc.code}
                  className="p-3 bg-purple-500/10 border-purple-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {gc.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          -${gc.amountUsed.toFixed(2)} applied • ${gc.remainingBalance.toFixed(2)} remaining
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onRemoveGiftCard(gc.code)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    className="w-full h-14 text-base"
                    onClick={onOpenGiftCardModal}
                    disabled={remaining <= 0 || hasUnresolvedPriceChanges}
                    data-testid="button-enter-gift-card"
                  >
                    <Gift className="h-5 w-5 mr-2" />
                    {appliedGiftCards.length > 0 ? 'Add Another Gift Card' : 'Enter Gift Card Code'}
                  </Button>
                </span>
              </TooltipTrigger>
              {hasUnresolvedPriceChanges && (
                <TooltipContent>
                  <p>Resolve price changes first</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {currentMethod === "custom" && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Payment method name</label>
            <Input
              type="text"
              placeholder="e.g., Venmo, Check, PayPal"
              value={customPaymentName}
              onChange={(e) => onCustomPaymentNameChange(e.target.value)}
              className="text-base h-12"
              data-testid="input-custom-payment-name"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    className="w-full h-14 text-base"
                    onClick={() => onAddPayment(remaining)}
                    disabled={!customPaymentName.trim() || hasUnresolvedPriceChanges}
                    data-testid="button-apply-custom"
                  >
                    <DollarSign className="h-5 w-5 mr-2" />
                    Apply ${remaining.toFixed(2)} via {customPaymentName.trim() || "..."}
                  </Button>
                </span>
              </TooltipTrigger>
              {hasUnresolvedPriceChanges && (
                <TooltipContent>
                  <p>Resolve price changes first</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  );
}
