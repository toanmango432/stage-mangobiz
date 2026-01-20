/**
 * PaymentMethodSelector Component
 * Displays payment method options and handles selection
 */

import { Card } from "@/components/ui/Card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PAYMENT_METHODS } from "../constants";
import type { PaymentMethodType } from "../types";

interface PaymentMethodSelectorProps {
  currentMethod: PaymentMethodType | null;
  onSelectMethod: (methodId: PaymentMethodType) => void;
  isDisabled: boolean;
  sentToPadTransactionId: string | null;
}

export function PaymentMethodSelector({
  currentMethod,
  onSelectMethod,
  isDisabled,
  sentToPadTransactionId,
}: PaymentMethodSelectorProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-3 block">
        {sentToPadTransactionId ? 'Or pay here' : 'Choose payment method'}
      </label>
      <TooltipProvider>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = currentMethod === method.id;

            const cardContent = (
              <Card
                key={method.id}
                className={`p-4 sm:p-5 flex flex-col items-center justify-center gap-2 ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover-elevate active-elevate-2"
                } ${isSelected && !isDisabled ? "ring-2 ring-primary bg-primary/5" : ""}`}
                onClick={isDisabled ? undefined : () => onSelectMethod(method.id)}
                data-testid={`card-payment-method-${method.id}`}
              >
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${
                  isSelected && !isDisabled ? "bg-primary text-primary-foreground" : "bg-primary/10"
                }`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isSelected && !isDisabled ? "" : "text-primary"}`} />
                </div>
                <span className="text-xs sm:text-sm font-medium text-center">{method.label}</span>
              </Card>
            );

            if (isDisabled) {
              return (
                <Tooltip key={method.id}>
                  <TooltipTrigger asChild>
                    {cardContent}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resolve price changes first</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return cardContent;
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
