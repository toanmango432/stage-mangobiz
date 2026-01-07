// PWA Service Worker Registration
export class PWARegistration {
  private static instance: PWARegistration;
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  static getInstance(): PWARegistration {
    if (!PWARegistration.instance) {
      PWARegistration.instance = new PWARegistration();
    }
    return PWARegistration.instance;
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    // Skip service worker in development to avoid caching issues
    if (import.meta.env.DEV) {
      console.log('Service Worker disabled in development mode');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.showUpdateNotification();
            }
          });
        }
      });

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  private showUpdateNotification(): void {
    // Create a custom update notification
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold">Update Available</h3>
          <p class="text-sm">A new version is ready to install.</p>
        </div>
        <button id="update-btn" class="ml-4 bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">
          Update
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    const updateBtn = notification.querySelector('#update-btn');
    updateBtn?.addEventListener('click', () => {
      this.updateServiceWorker();
      notification.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  private async updateServiceWorker(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      return await this.registration.unregister();
    }
    return false;
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Export singleton instance
export const pwaRegistration = PWARegistration.getInstance();




