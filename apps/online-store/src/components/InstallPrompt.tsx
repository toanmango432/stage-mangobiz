import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if prompt was dismissed before
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show again for 7 days
      }
    }

    // Listen for install prompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt for iOS after a delay
    if (iOS && !isInstalled) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <Card className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 p-4 shadow-lg animate-slide-in-right">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-semibold mb-1">Install Mango Nail Salon</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isIOS
              ? "Install our app for the best experience. Tap Share → Add to Home Screen"
              : "Get quick access and work offline by installing our app"
            }
          </p>
          {!isIOS && deferredPrompt && (
            <Button onClick={handleInstall} size="sm" className="w-full">
              Install App
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
