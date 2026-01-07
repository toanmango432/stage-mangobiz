import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  shortLabel?: string; // For mobile
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn("w-full bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50", className)}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <React.Fragment key={step.id}>
                {/* Step Circle */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                      isCompleted && "bg-green-500 text-white scale-100",
                      isCurrent && "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20",
                      isUpcoming && "bg-muted text-muted-foreground scale-90"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 animate-in zoom-in duration-300" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <span
                    className={cn(
                      "text-xs font-medium text-center transition-all duration-300",
                      isCurrent && "text-foreground font-semibold",
                      isCompleted && "text-green-600",
                      isUpcoming && "text-muted-foreground",
                      "hidden sm:block"
                    )}
                  >
                    {step.label}
                  </span>
                  
                  {/* Mobile Short Label */}
                  <span
                    className={cn(
                      "text-xs font-medium text-center transition-all duration-300",
                      isCurrent && "text-foreground font-semibold",
                      isCompleted && "text-green-600",
                      isUpcoming && "text-muted-foreground",
                      "sm:hidden"
                    )}
                  >
                    {step.shortLabel || step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 relative">
                    <div className="absolute inset-0 bg-muted" />
                    <div
                      className={cn(
                        "absolute inset-0 bg-green-500 transition-all duration-500",
                        isCompleted ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
