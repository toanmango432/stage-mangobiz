// Background Sync Utilities
// Handles offline action queuing and synchronization

export interface SyncAction {
  type: string;
  data: any;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  retryCount?: number;
  maxRetries?: number;
}

export class BackgroundSyncManager {
  private isOnline: boolean = navigator.onLine;
  private syncWorker: ServiceWorker | null = null;

  constructor() {
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        this.syncWorker = registration.active;
        
        // Listen for service worker updates
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { data } = event;
    
    if (data.type === 'SYNC_COMPLETE') {
      console.log('Background sync completed');
      this.notifySyncComplete(data.results);
    } else if (data.type === 'SYNC_ERROR') {
      console.error('Background sync error:', data.error);
      this.notifySyncError(data.error);
    }
  }

  private notifySyncComplete(results: any) {
    // Emit custom event for UI updates
    window.dispatchEvent(new CustomEvent('syncComplete', { detail: results }));
  }

  private notifySyncError(error: any) {
    // Emit custom event for error handling
    window.dispatchEvent(new CustomEvent('syncError', { detail: error }));
  }

  async queueAction(action: SyncAction): Promise<void> {
    if (!this.syncWorker) {
      throw new Error('Service worker not available');
    }

    const syncAction: SyncAction = {
      ...action,
      retryCount: 0,
      maxRetries: action.maxRetries || 3
    };

    try {
      this.syncWorker.postMessage({
        type: 'ADD_TO_SYNC_QUEUE',
        action: syncAction
      });
      
      console.log('Action queued for background sync:', syncAction.type);
    } catch (error) {
      console.error('Failed to queue action:', error);
      throw error;
    }
  }

  async triggerSync(): Promise<void> {
    if (!this.syncWorker) {
      throw new Error('Service worker not available');
    }

    try {
      this.syncWorker.postMessage({
        type: 'TRIGGER_SYNC'
      });
      
      console.log('Background sync triggered');
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      throw error;
    }
  }

  async getQueueStatus(): Promise<{ count: number; items: SyncAction[] }> {
    // This would typically query the service worker for queue status
    // For now, return a mock response
    return {
      count: 0,
      items: []
    };
  }

  // Convenience methods for common actions
  async queueBooking(bookingData: any): Promise<void> {
    return this.queueAction({
      type: 'BOOKING',
      data: bookingData,
      url: '/api/v1/bookings',
      method: 'POST'
    });
  }

  async queueOrder(orderData: any): Promise<void> {
    return this.queueAction({
      type: 'ORDER',
      data: orderData,
      url: '/api/v1/orders',
      method: 'POST'
    });
  }

  async queueReview(reviewData: any): Promise<void> {
    return this.queueAction({
      type: 'REVIEW',
      data: reviewData,
      url: '/api/v1/reviews',
      method: 'POST'
    });
  }

  async queueContactForm(formData: any): Promise<void> {
    return this.queueAction({
      type: 'CONTACT_FORM',
      data: formData,
      url: '/api/v1/contact',
      method: 'POST'
    });
  }
}

// Export singleton instance
export const backgroundSync = new BackgroundSyncManager();

// Export utility functions
export const queueOfflineAction = (action: SyncAction) => backgroundSync.queueAction(action);
export const triggerBackgroundSync = () => backgroundSync.triggerSync();
export const getSyncStatus = () => backgroundSync.getQueueStatus();



