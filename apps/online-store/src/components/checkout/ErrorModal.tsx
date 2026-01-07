import { AlertCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckoutError } from "@/types/api";

interface ErrorModalProps {
  error: CheckoutError | null;
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onResolve?: () => void;
}

export const ErrorModal = ({ error, open, onClose, onRetry, onResolve }: ErrorModalProps) => {
  if (!error) return null;

  const getTitle = () => {
    switch (error.type) {
      case 'slot_conflict':
        return 'Appointment Time Unavailable';
      case 'stock_changed':
        return 'Cart Items Changed';
      case 'payment_failed':
        return 'Payment Failed';
      case 'validation_error':
        return 'Please Check Your Information';
      default:
        return 'Something Went Wrong';
    }
  };

  const getIcon = () => {
    return <AlertCircle className="h-12 w-12 text-destructive" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="flex flex-col items-center text-center space-y-4 py-6">
          {getIcon()}
          
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
            <p className="text-muted-foreground">{error.message}</p>
          </div>

          {error.affectedItems && error.affectedItems.length > 0 && (
            <div className="w-full bg-muted/50 rounded-lg p-4 text-left">
              <p className="text-sm font-medium mb-2">Affected items:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {error.affectedItems.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {error.suggestions && error.suggestions.length > 0 && (
            <div className="w-full text-left">
              <p className="text-sm font-medium mb-2">What you can do:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 w-full pt-4">
            {onResolve && (
              <Button onClick={onResolve} variant="outline" className="flex-1">
                Resolve
              </Button>
            )}
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                Try Again
              </Button>
            )}
            {!onRetry && !onResolve && (
              <Button onClick={onClose} className="flex-1">
                Got It
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
