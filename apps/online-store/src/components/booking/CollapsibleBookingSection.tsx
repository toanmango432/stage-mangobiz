import { ReactNode, useState, useEffect } from 'react';
import { LucideIcon, CheckCircle, Edit3, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SectionState } from '@/hooks/useSmartBookingFlow';

interface CollapsibleBookingSectionProps {
  title: string;
  icon: LucideIcon;
  state: SectionState;
  summary?: ReactNode;
  onExpand: () => void;
  onCollapse: () => void;
  onComplete: (data: any) => void;
  children: ReactNode;
  required?: boolean;
  error?: string;
  stepNumber?: number;
  isLast?: boolean;
}

export const CollapsibleBookingSection = ({
  title,
  icon: Icon,
  state,
  summary,
  onExpand,
  onCollapse,
  onComplete,
  children,
  required = false,
  error,
  stepNumber,
  isLast = false,
}: CollapsibleBookingSectionProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Handle completion animation
  useEffect(() => {
    if (state === 'completed') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [state]);

  const handleToggle = () => {
    if (state === 'expanded') {
      onCollapse();
    } else {
      onExpand();
    }
  };

  const handleComplete = (data: any) => {
    setIsAnimating(true);
    onComplete(data);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getStateIcon = () => {
    switch (state) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Icon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'expanded':
        return 'border-primary/20 bg-primary/5';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <div className="relative">
      {/* Progress Line */}
      {!isLast && (
        <div className="absolute left-6 top-16 w-0.5 h-8 bg-gradient-to-b from-muted to-transparent z-0" />
      )}

      <Card 
        className={cn(
          "transition-all duration-300 ease-out",
          getStateColor(),
          state === 'expanded' && "shadow-lg scale-[1.02]",
          state === 'error' && "animate-pulse",
          isAnimating && "animate-bounce"
        )}
      >
        <CardHeader 
          className="cursor-pointer select-none"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-4">
            {/* Step Number */}
            {stepNumber && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {stepNumber}
              </div>
            )}

            {/* Icon */}
            <div className="flex-shrink-0">
              {getStateIcon()}
            </div>

            {/* Title and Summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {title}
                </h3>
                {required && (
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                )}
                {state === 'completed' && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    Complete
                  </Badge>
                )}
              </div>
              
              {state === 'collapsed' && summary && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {summary}
                </div>
              )}
              
              {error && (
                <div className="mt-1 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Toggle Button */}
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                {state === 'expanded' ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Expanded Content */}
        {state === 'expanded' && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {children}
              
              {/* Complete Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleComplete({})}
                  className="px-6"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete This Step
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {/* Edit Button for Completed Sections */}
        {state === 'completed' && (
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExpand()}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="confetti-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



