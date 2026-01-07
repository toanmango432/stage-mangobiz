import { useState, useEffect } from 'react';
import { Clock, Wifi, WifiOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { backgroundSync } from '@/lib/pwa/background-sync';
import type { SyncAction } from '@/lib/pwa/background-sync';

interface QueueItem extends SyncAction {
  id: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export const OfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSyncComplete = (event: CustomEvent) => {
      console.log('Sync completed:', event.detail);
      // Update queue items status
      setQueueItems(prev => 
        prev.map(item => ({ ...item, status: 'completed' }))
      );
    };
    const handleSyncError = (event: CustomEvent) => {
      console.error('Sync error:', event.detail);
      // Update queue items status
      setQueueItems(prev => 
        prev.map(item => ({ ...item, status: 'failed' }))
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('syncComplete', handleSyncComplete as EventListener);
    window.addEventListener('syncError', handleSyncError as EventListener);

    // Load initial queue status
    loadQueueStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncComplete', handleSyncComplete as EventListener);
      window.removeEventListener('syncError', handleSyncError as EventListener);
    };
  }, []);

  const loadQueueStatus = async () => {
    try {
      const status = await backgroundSync.getQueueStatus();
      setQueueItems(status.items.map(item => ({
        ...item,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'pending' as const
      })));
    } catch (error) {
      console.error('Failed to load queue status:', error);
    }
  };

  const handleRetrySync = async () => {
    try {
      await backgroundSync.triggerSync();
      setQueueItems(prev => 
        prev.map(item => ({ ...item, status: 'syncing' }))
      );
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'syncing':
        return 'Syncing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'BOOKING':
        return 'Booking';
      case 'ORDER':
        return 'Order';
      case 'REVIEW':
        return 'Review';
      case 'CONTACT_FORM':
        return 'Contact Form';
      default:
        return type;
    }
  };

  if (!isVisible && queueItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              {isOnline ? 'Online' : 'Offline'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? '−' : '+'}
            </Button>
          </div>
        </CardHeader>
        
        {isVisible && (
          <CardContent className="pt-0">
            {queueItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">All actions synced</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {queueItems.length} pending action{queueItems.length !== 1 ? 's' : ''}
                  </span>
                  {!isOnline && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetrySync}
                      disabled={queueItems.some(item => item.status === 'syncing')}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
                
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span>{getActionLabel(item.type)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getStatusText(item.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};



