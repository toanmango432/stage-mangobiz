// PWA Cache Management
export class PWACache {
  private static instance: PWACache;
  private cacheName = 'mango-store-v1';
  private staticCacheName = 'mango-static-v1';
  private dynamicCacheName = 'mango-dynamic-v1';

  static getInstance(): PWACache {
    if (!PWACache.instance) {
      PWACache.instance = new PWACache();
    }
    return PWACache.instance;
  }

  async openCache(cacheName: string): Promise<Cache> {
    return await caches.open(cacheName);
  }

  async cacheStaticAssets(): Promise<void> {
    const staticAssets = [
      '/',
      '/index.html',
      '/manifest.json',
      '/favicon.ico',
      '/src/assets/hero-salon.jpg',
      '/src/assets/logo.svg'
    ];

    const cache = await this.openCache(this.staticCacheName);
    await cache.addAll(staticAssets);
  }

  async cacheDynamicContent(url: string): Promise<void> {
    const cache = await this.openCache(this.dynamicCacheName);
    const response = await fetch(url);
    
    if (response.ok) {
      await cache.put(url, response.clone());
    }
  }

  async getCachedResponse(url: string): Promise<Response | undefined> {
    // Try static cache first
    let cache = await this.openCache(this.staticCacheName);
    let response = await cache.match(url);
    
    if (response) return response;

    // Try dynamic cache
    cache = await this.openCache(this.dynamicCacheName);
    response = await cache.match(url);
    
    return response;
  }

  async clearOldCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    const currentCaches = [this.cacheName, this.staticCacheName, this.dynamicCacheName];
    
    const deletePromises = cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => caches.delete(cacheName));

    await Promise.all(deletePromises);
  }

  async getCacheSize(): Promise<{ [key: string]: number }> {
    const cacheNames = await caches.keys();
    const sizes: { [key: string]: number } = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      let totalSize = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }

      sizes[cacheName] = totalSize;
    }

    return sizes;
  }

  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
    await Promise.all(deletePromises);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const pwaCache = PWACache.getInstance();




