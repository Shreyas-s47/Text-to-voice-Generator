// Service Worker for Text-to-Voice Generator
// Provides offline functionality and performance optimizations

const CACHE_NAME = 'text-to-voice-v1';
const STATIC_CACHE = 'static-v1';

// Files to cache immediately
const PRECACHE_RESOURCES = [
    '/',
    '/index.html',
    '/index-optimized.html'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching essential resources');
                return cache.addAll(PRECACHE_RESOURCES);
            })
            .then(() => {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Claim all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Strategy: Cache First for static resources
    if (request.destination === 'document' || 
        request.destination === 'style' || 
        request.destination === 'script') {
        
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return cached version
                        return cachedResponse;
                    }
                    
                    // Fetch and cache new version
                    return fetch(request).then((response) => {
                        // Check if response is valid
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone response before caching
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        
                        return response;
                    });
                })
                .catch(() => {
                    // Return offline fallback if available
                    if (request.destination === 'document') {
                        return caches.match('/index-optimized.html');
                    }
                })
        );
    }
});

// Background sync for future enhancements
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        // Could be used for syncing user preferences
    }
});

// Push notifications (for future features)
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Open App',
                    icon: '/check.png'
                },
                {
                    action: 'close',
                    title: 'Close',
                    icon: '/xmark.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification('Text-to-Voice', options)
        );
    }
});

// Performance monitoring
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PERFORMANCE_MARK') {
        console.log('Performance mark:', event.data.name, event.data.duration);
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});