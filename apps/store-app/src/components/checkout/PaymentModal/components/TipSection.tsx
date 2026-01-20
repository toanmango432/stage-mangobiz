/**
 * TipSection Component
 * Handles tip selection, custom tip input, and tip distribution
 */

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { TIP_PERCENTAGES } from "../constants";
import type { TipDistribution, StaffMember } from "../types";

interface TipSectionProps {
  total: number;
  totalWithTip: number;
  tipPercentage: number | null;
  customTip: string;
  tipAmount: number;
  staffMembers: StaffMember[];
  showTipDistribution: boolean;
  tipDistribution: TipDistribution[];
  onSelectTipPercentage: (percentage: number) => void;
  onCustomTipChange: (value: string) => void;
  onAutoDistributeTip: () => void;
  onEqualSplitTip: () => void;
  onContinueToPayment: () => void;
}

export function TipSection({
  total,
  totalWithTip,
  tipPercentage,
  customTip,
  tipAmount,
  staffMembers,
  showTipDistribution,
  tipDistribution,
  onSelectTipPercentage,
  onCustomTipChange,
  onAutoDistributeTip,
  onEqualSplitTip,
  onContinueToPayment,
}: TipSectionProps) {
  return (
    <>
      <Card className="p-4 bg-muted/30">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Service total</span>
          <span className="text-xl font-bold">${total.toFixed(2)}</span>
        </div>
      </Card>

      <Separator />

      <div>
        <label className="text-sm font-medium mb-3 block">Add a tip (optional)</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TIP_PERCENTAGES.map((percentage) => (
            <Button
              key={percentage}
              variant={tipPercentage === percentage ? "default" : "outline"}
              onClick={() => onSelectTipPercentage(percentage)}
              className="h-12 sm:h-11 text-sm sm:text-base"
              data-testid={`button-tip-${percentage}`}
            >
              <div className="flex flex-col items-center">
                <span>{percentage}%</span>
                <span className="text-xs opacity-70">${((total * percentage) / 100).toFixed(2)}</span>
              </div>
            </Button>
          ))}
          <Button
            variant={tipPercentage === 0 ? "default" : "outline"}
            onClick={() => {
              onSelectTipPercentage(0);
            }}
            className="h-12 sm:h-11 text-sm sm:text-base"
            data-testid="button-no-tip"
          >
            No Tip
          </Button>
        </div>
        <Input
          type="number"
          placeholder="Custom tip amount"
          value={customTip}
          onChange={(e) => onCustomTipChange(e.target.value)}
          className="mt-3 h-11"
          data-testid="input-custom-tip"
        />

        {staffMembers.length > 1 && tipAmount > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAutoDistributeTip}
                className="flex-1"
                data-testid="button-auto-distribute-tip"
              >
                Auto-Distribute
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onEqualSplitTip}
                className="flex-1"
                data-testid="button-equal-split-tip"
              >
                Split Equally
              </Button>
            </div>

            {showTipDistribution && tipDistribution.length > 0 && (
              <Card className="p-3 bg-green-500/5 border-green-500/20">
                <div className="text-xs font-medium text-muted-foreground mb-2">Tip Distribution</div>
                <div className="space-y-1">
                  {tipDistribution.map((dist, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{dist.staffName}</span>
                      <span className="font-semibold text-green-600 dark:text-green-500">
                        ${dist.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Separator />

      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex justify-between items-center">
          <span className="font-medium">Your total (with tip)</span>
          <span className="text-2xl font-bold text-primary">${totalWithTip.toFixed(2)}</span>
        </div>
      </Card>

      <Button
        className="w-full h-12 text-base"
        onClick={onContinueToPayment}
        data-testid="button-continue-to-payment"
      >
        Continue to Payment
      </Button>
    </>
  );
}
