/**
 * StepIndicator Component
 * Displays the wizard step progress indicator for the payment modal
 */

import { Check } from "lucide-react";
import { STEPS } from "../constants";

interface StepIndicatorProps {
  currentStep: number;
  isFullyPaid: boolean;
}

export function StepIndicator({ currentStep, isFullyPaid }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-4" data-testid="stepper-indicator">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep || (step.id === 3 && isFullyPaid);
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center
                  transition-all duration-200 text-sm font-semibold
                  ${isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }
                `}
                data-testid={`step-circle-${step.id}`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="text-center">
                <p className={`text-xs sm:text-sm font-medium ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {step.sublabel}
                </p>
              </div>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-6 sm:w-12 mt-[-20px] sm:mt-[-24px] ${
                  step.id < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
