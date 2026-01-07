import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide indicator after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className={`shadow-lg transition-all duration-300 ${
        isOnline 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Back Online
                  </p>
                  <p className="text-xs text-green-600">
                    Your connection has been restored
                  </p>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    You're Offline
                  </p>
                  <p className="text-xs text-red-600">
                    Some features may be limited
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="ml-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
