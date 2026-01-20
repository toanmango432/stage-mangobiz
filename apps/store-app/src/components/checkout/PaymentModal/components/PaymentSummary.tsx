/**
 * PaymentSummary Component
 * Displays applied payments, remaining amount, and change calculation
 */

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import { Check, X } from "lucide-react";
import type { PaymentMethod } from "../types";

interface PaymentSummaryProps {
  remaining: number;
  totalWithTip: number;
  paymentMethods: PaymentMethod[];
  totalChangeToReturn: number;
  onRemovePayment: (index: number) => void;
}

export function PaymentSummary({
  remaining,
  totalWithTip,
  paymentMethods,
  totalChangeToReturn,
  onRemovePayment,
}: PaymentSummaryProps) {
  const isFullyPaid = remaining <= 0.01 && paymentMethods.length > 0;

  return (
    <>
      {/* Amount remaining or fully paid indicator */}
      {remaining > 0.01 ? (
        <Card className="p-4 sm:p-6 bg-primary/10 border-primary/30">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount left to pay</p>
            <p className="text-3xl sm:text-4xl font-bold text-primary" data-testid="text-amount-left">
              ${remaining.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              of ${totalWithTip.toFixed(2)} total
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4 sm:p-6 bg-green-500/10 border-green-500/30">
          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600 dark:text-green-500">All paid!</p>
              <p className="text-sm text-muted-foreground">Ready to complete</p>
            </div>
          </div>
        </Card>
      )}

      <Separator />

      {/* Applied payments */}
      {paymentMethods.length > 0 && (
        <>
          <div>
            <label className="text-sm font-medium mb-2 block">Payments applied</label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-2 text-sm gap-2"
                  data-testid={`badge-payment-${index}`}
                >
                  <span className="capitalize">
                    {method.customName || method.type.replace('_', ' ')}
                  </span>
                  <span className="font-bold">${method.amount.toFixed(2)}</span>
                  {method.type === "cash" && method.tendered && method.tendered > method.amount && (
                    <span className="text-xs opacity-70">
                      (Cash received: ${method.tendered.toFixed(2)})
                    </span>
                  )}
                  <button
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    onClick={() => onRemovePayment(index)}
                    aria-label={`Remove ${method.customName || method.type.replace('_', ' ')} payment`}
                    data-testid={`button-remove-payment-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Change to return */}
          {totalChangeToReturn > 0 && (
            <Card className="p-3 bg-amber-500/10 border-amber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Change to give back</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-500">
                  ${totalChangeToReturn.toFixed(2)}
                </span>
              </div>
            </Card>
          )}

          <Separator />
        </>
      )}
    </>
  );
}
