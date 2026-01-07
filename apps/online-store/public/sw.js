// Mango Online Store Service Worker
// Advanced caching strategies for production

const CACHE_VERSION = 'v2';
const CACHE_NAMES = {
  STATIC: `mango-static-${CACHE_VERSION}`,
  DYNAMIC: `mango-dynamic-${CACHE_VERSION}`,
  API: `mango-api-${CACHE_VERSION}`,
  IMAGES: `mango-images-${CACHE_VERSION}`,
  FONTS: `mango-fonts-${CACHE_VERSION}`
};

const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cacheFirst',
  NETWORK_FIRST: 'networkFirst',
  STALE_WHILE_REVALIDATE: 'staleWhileRevalidate',
  NETWORK_ONLY: 'networkOnly',
  CACHE_ONLY: 'cacheOnly'
};

// Cache configuration
const CACHE_CONFIG = {
  maxEntries: 50,
  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
  purgeOnQuotaError: true
};

// Cache utility functions
const openCache = (cacheName) => caches.open(cacheName);

const cacheFirst = async (request, cacheName) => {
  const cache = await openCache(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
};

const networkFirst = async (request, cacheName) => {
  const cache = await openCache(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
};

const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await openCache(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
};

const getCacheStrategy = (url) => {
  if (url.includes('/api/')) return CACHE_STRATEGIES.NETWORK_FIRST;
  if (url.match(/\.(css|js)$/)) return CACHE_STRATEGIES.CACHE_FIRST;
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return CACHE_STRATEGIES.CACHE_FIRST;
  if (url.match(/\.(woff|woff2|ttf|eot)$/)) return CACHE_STRATEGIES.CACHE_FIRST;
  if (url === self.location.origin + '/' || url.includes('/index.html')) return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  return CACHE_STRATEGIES.NETWORK_FIRST;
};

const getCacheName = (url) => {
  if (url.includes('/api/')) return CACHE_NAMES.API;
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return CACHE_NAMES.IMAGES;
  if (url.match(/\.(woff|woff2|ttf|eot)$/)) return CACHE_NAMES.FONTS;
  if (url.match(/\.(css|js)$/)) return CACHE_NAMES.STATIC;
  return CACHE_NAMES.DYNAMIC;
};

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      openCache(CACHE_NAMES.STATIC).then(cache => cache.addAll(STATIC_URLS)),
      openCache(CACHE_NAMES.DYNAMIC),
      openCache(CACHE_NAMES.API),
      openCache(CACHE_NAMES.IMAGES),
      openCache(CACHE_NAMES.FONTS)
    ]).then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          const isCurrentCache = Object.values(CACHE_NAMES).includes(cacheName);
          if (!isCurrentCache) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Background sync for offline actions
const BACKGROUND_SYNC_TAG = 'mango-background-sync';
const SYNC_QUEUE_KEY = 'mango-sync-queue';

const addToSyncQueue = async (action) => {
  const queue = await getSyncQueue();
  queue.push({
    ...action,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  });
  await setSyncQueue(queue);
};

const getSyncQueue = async () => {
  try {
    const queue = await indexedDB.open('MangoSyncQueue', 1);
    return new Promise((resolve, reject) => {
      queue.onsuccess = () => {
        const transaction = queue.result.transaction(['queue'], 'readonly');
        const store = transaction.objectStore('queue');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      };
      queue.onerror = () => reject(queue.error);
    });
  } catch (error) {
    return [];
  }
};

const setSyncQueue = async (queue) => {
  try {
    const db = await indexedDB.open('MangoSyncQueue', 1);
    return new Promise((resolve, reject) => {
      db.onsuccess = () => {
        const transaction = db.result.transaction(['queue'], 'readwrite');
        const store = transaction.objectStore('queue');
        store.clear();
        queue.forEach(item => store.add(item));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      db.onerror = () => reject(db.error);
    });
  } catch (error) {
    console.error('Failed to save sync queue:', error);
  }
};

// Fetch event with advanced caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Vite dev server requests in development
  if (url.hostname === 'localhost' && (
    url.pathname.includes('/src/') || 
    url.pathname.includes('/@vite/') || 
    url.pathname.includes('/node_modules/')
  )) {
    return;
  }

  // Skip service worker and workbox requests
  if (url.pathname.includes('sw.js') || url.pathname.includes('workbox-')) {
    return;
  }

  // Determine caching strategy
  const strategy = getCacheStrategy(request.url);
  const cacheName = getCacheName(request.url);
  
  let responsePromise;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      responsePromise = cacheFirst(request, cacheName);
      break;
    case CACHE_STRATEGIES.NETWORK_FIRST:
      responsePromise = networkFirst(request, cacheName);
      break;
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      responsePromise = staleWhileRevalidate(request, cacheName);
      break;
    default:
      responsePromise = fetch(request);
  }
  
  event.respondWith(
    responsePromise.catch(error => {
      console.error('Fetch failed:', error);
      
      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/offline.html') || caches.match('/index.html');
      }
      
      // Return cached version if available
      return caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return offline response
        return new Response('Offline content not available', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      });
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(processSyncQueue());
  }
});

const processSyncQueue = async () => {
  try {
    const queue = await getSyncQueue();
    console.log('Processing sync queue:', queue.length, 'items');
    
    for (const action of queue) {
      try {
        await processSyncAction(action);
        // Remove successful action from queue
        const updatedQueue = queue.filter(item => item.id !== action.id);
        await setSyncQueue(updatedQueue);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        // Keep failed actions in queue for retry
      }
    }
  } catch (error) {
    console.error('Failed to process sync queue:', error);
  }
};

const processSyncAction = async (action) => {
  const { type, data, url, method = 'POST' } = action;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
};

// Message handling for updates and sync
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'ADD_TO_SYNC_QUEUE') {
    event.waitUntil(addToSyncQueue(event.data.action));
  }
  
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(
      self.registration.sync.register(BACKGROUND_SYNC_TAG)
    );
  }
});