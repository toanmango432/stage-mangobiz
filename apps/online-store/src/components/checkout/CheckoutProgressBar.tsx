import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutProgressBarProps {
  currentStep: number;
  steps: string[];
  onStepClick?: (step: number) => void;
}

export const CheckoutProgressBar = ({ 
  currentStep, 
  steps,
  onStepClick 
}: CheckoutProgressBarProps) => {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full mb-6">
        <div 
          className="absolute h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isClickable = stepNumber <= currentStep && onStepClick;

          return (
            <div
              key={step}
              className={cn(
                "flex flex-col items-center flex-1",
                isClickable && "cursor-pointer"
              )}
              onClick={() => isClickable && onStepClick(stepNumber)}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{stepNumber}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm text-center",
                  isCurrent && "font-medium text-foreground",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
