/**
 * CompletionSection Component
 * Displays the payment completion summary with receipt and done buttons
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import { Check, FileText } from "lucide-react";
import type { PaymentMethod, TipDistribution } from "../types";

interface CompletionSectionProps {
  total: number;
  tipAmount: number;
  totalWithTip: number;
  paymentMethods: PaymentMethod[];
  showTipDistribution: boolean;
  tipDistribution: TipDistribution[];
  onShowReceipt?: () => void;
  onDone: () => void;
}

export function CompletionSection({
  total,
  tipAmount,
  totalWithTip,
  onShowReceipt,
  onDone,
}: CompletionSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
        <Check className="h-10 w-10 text-green-600 dark:text-green-500" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-1">Payment Complete!</h3>
        <p className="text-muted-foreground">Transaction has been processed successfully.</p>
      </div>
      <Card className="w-full p-4 mt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tip</span>
            <span className="text-green-600 dark:text-green-500">${tipAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total paid</span>
            <span>${totalWithTip.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Receipt and Done buttons */}
      <div className="flex gap-3 mt-4 w-full">
        {onShowReceipt && (
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={onShowReceipt}
            data-testid="button-view-receipt"
          >
            <FileText className="h-5 w-5 mr-2" />
            View Receipt
          </Button>
        )}
        <Button
          className="flex-1 h-12"
          onClick={onDone}
          data-testid="button-done"
        >
          <Check className="h-5 w-5 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
}
