// Deprecated: This component is no longer used in the scroll-based booking flow
export type BookingStep = 'services' | 'datetime' | 'specialist' | 'details' | 'review';
import { cn } from '@/lib/utils';
import { ShoppingBag, Calendar, Users, FileText, CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: BookingStep;
}

const steps = [
  { key: 'services' as BookingStep, label: 'Services', icon: ShoppingBag },
  { key: 'datetime' as BookingStep, label: 'Date & Time', icon: Calendar },
  { key: 'specialist' as BookingStep, label: 'Specialist', icon: Users },
  { key: 'details' as BookingStep, label: 'Details', icon: FileText },
  { key: 'review' as BookingStep, label: 'Review', icon: CheckCircle },
];

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const currentIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isActive && 'bg-primary text-primary-foreground scale-110',
                  isCompleted && 'bg-primary/20 text-primary',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium hidden sm:block',
                  isActive && 'text-primary',
                  isCompleted && 'text-primary/80',
                  !isActive && !isCompleted && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 transition-all',
                  isCompleted ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
