import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DemoRibbon = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only show in standalone mode
    console.log('🔍 DemoRibbon: __MODE__ =', typeof __MODE__ !== 'undefined' ? __MODE__ : 'undefined');
    if (typeof __MODE__ === 'undefined' || __MODE__ !== 'standalone') {
      console.log('⏭️  DemoRibbon: Not in standalone mode, skipping');
      return;
    }

    // Check if user has dismissed the ribbon
    const dismissed = localStorage.getItem('demo-ribbon-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Show ribbon after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('demo-ribbon-dismissed', 'true');
  };

  if (__MODE__ !== 'standalone' || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-yellow-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Demo Mode — Data not live
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-white hover:bg-white/20 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
