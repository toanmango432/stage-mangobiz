import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CheckoutStepsProps {
  currentStep: number;
  steps: string[];
}

export const CheckoutSteps = ({ currentStep, steps }: CheckoutStepsProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isCompleted || isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                    isCompleted && "text-primary-foreground",
                    isActive && "text-primary-foreground ring-4 ring-primary/20",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                    >
                      <Check className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    stepNumber
                  )}
                </motion.div>
                <span className={cn(
                  "text-xs mt-2 text-center hidden sm:block",
                  (isActive || isCompleted) ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {step}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: stepNumber < currentStep ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                  }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 h-0.5 mx-2"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
