/**
 * PriceChangeWarning Component
 * Displays a warning when there are unresolved price changes
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Zap } from "lucide-react";
import type { CheckoutTicketService } from "@/store/slices/uiTicketsSlice";

interface PriceChangeWarningProps {
  unresolvedPriceChanges: CheckoutTicketService[];
  onClose: () => void;
  onOpenPriceResolution?: () => void;
}

export function PriceChangeWarning({
  unresolvedPriceChanges,
  onClose,
  onOpenPriceResolution,
}: PriceChangeWarningProps) {
  if (unresolvedPriceChanges.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-amber-500/10 border-amber-500/30" data-testid="price-change-payment-warning">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Zap className="h-5 w-5 text-amber-600 dark:text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {unresolvedPriceChanges.length} service{unresolvedPriceChanges.length > 1 ? 's have' : ' has'} price changes
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
            Resolve price changes before processing payment
          </p>
          {onOpenPriceResolution && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-500/10 dark:text-amber-400 dark:border-amber-600"
              onClick={() => {
                onClose();
                onOpenPriceResolution();
              }}
              data-testid="button-resolve-prices-from-payment"
            >
              <Zap className="h-4 w-4 mr-2" />
              Review & Resolve Prices
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
