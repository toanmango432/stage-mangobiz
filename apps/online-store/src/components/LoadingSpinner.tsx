import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

export const LoadingSpinner = ({ 
  size = "md", 
  className,
  fullScreen = false,
  text 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const spinner = (
    <>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
      {text && <p className="mt-3 text-sm text-muted-foreground">{text}</p>}
    </>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {spinner}
    </div>
  );
};
