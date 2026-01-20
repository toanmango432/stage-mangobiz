/**
 * ProcessingOverlay Component
 * Displays processing and success states during payment
 */

import { Loader2, Check } from "lucide-react";

interface ProcessingOverlayProps {
  isProcessing: boolean;
  showSuccess: boolean;
}

export function ProcessingOverlay({ isProcessing, showSuccess }: ProcessingOverlayProps) {
  if (!isProcessing && !showSuccess) {
    return null;
  }

  return (
    <>
      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">Processing payment...</h3>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </div>
          </div>
        </div>
      )}

      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center checkmark-animate">
              <Check className="h-10 w-10 text-primary checkmark-icon" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1">All paid!</h3>
              <p className="text-sm text-muted-foreground">Preparing your receipt...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
