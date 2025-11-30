import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  X, 
  MousePointer, 
  Eye, 
  Filter,
  BarChart3
} from "lucide-react";

export function OnboardingTips() {
  const [currentTip, setCurrentTip] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const tips = [
    {
      icon: <Eye className="w-4 h-4" />,
      title: "Quick Overview",
      content: "Each row shows a staff member's weekly schedule. Colors indicate different shift types - blue for regular, orange for extra shifts."
    },
    {
      icon: <MousePointer className="w-4 h-4" />,
      title: "Interactive Elements", 
      content: "Hover over shift blocks to see detailed information. Click the '+' button to add new shifts for staff members."
    },
    {
      icon: <Filter className="w-4 h-4" />,
      title: "Smart Filtering",
      content: "Use the filters above to quickly find specific staff, departments, or shift types. Perfect for managing large teams."
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: "Key Metrics",
      content: "The summary cards show total hours, active staff, extra shifts, and staffing gaps to help you manage coverage."
    }
  ];

  if (!isVisible) return null;

  const nextTip = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      setIsVisible(false);
    }
  };

  const closeTips = () => setIsVisible(false);

  return (
    <Alert className="mb-4 bg-primary/5 border-primary/20">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {tips[currentTip].icon}
            <span className="font-medium text-sm">{tips[currentTip].title}</span>
            <span className="text-xs text-muted-foreground">({currentTip + 1}/{tips.length})</span>
          </div>
          <AlertDescription className="text-sm mb-3">
            {tips[currentTip].content}
          </AlertDescription>
          <div className="flex items-center gap-2">
            <Button 
              onClick={nextTip} 
              size="sm" 
              className="h-7 text-xs"
            >
              {currentTip < tips.length - 1 ? 'Next Tip' : 'Got It!'}
            </Button>
            <Button 
              onClick={closeTips} 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
            >
              Skip Tour
            </Button>
          </div>
        </div>
        <Button
          onClick={closeTips}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-background/50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
}