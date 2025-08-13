// 🛡️ Second Chance - Service Worker for Offline Recovery Support
// PWA implementation following CartPilot excellence patterns
// Critical: Crisis support must work offline!

const CACHE_VERSION = 'second-chance-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Critical resources that MUST be cached for offline crisis support
const CRITICAL_RESOURCES = [
    '/',
    '/dashboard.html',
    '/index.html',
    '/api/crisis-resources',
    '/api/health'
];

// Resources to cache for enhanced offline experience
const STATIC_RESOURCES = [
    '/dashboard.html',
    '/index.html',
    '/favicon.ico'
];

// API endpoints to cache for offline functionality
const CACHEABLE_APIS = [
    '/api/crisis-resources',
    '/api/health',
    '/api/monitored-apps',
    '/api/admin-requests',
    '/api/user/stats'
];

// Crisis support data - always available offline
const OFFLINE_CRISIS_DATA = {
    emergency: {
        suicide_prevention: {
            number: '988',
            text: 'Available 24/7',
            description: 'Suicide & Crisis Lifeline'
        },
        crisis_text: {
            number: '741741',
            text: 'Text HOME',
            description: 'Crisis Text Line'
        },
        samhsa: {
            number: '1-800-662-4357',
            text: 'Available 24/7',
            description: 'SAMHSA National Helpline'
        }
    },
    resources: [
        {
            name: 'Narcotics Anonymous',
            website: 'https://na.org',
            description: 'Find local meetings and support'
        },
        {
            name: 'SMART Recovery',
            website: 'https://smartrecovery.org',
            description: '4-Point Program for recovery'
        }
    ],
    offline_message: 'You are offline, but crisis support is always available. Call 988 for immediate help.'
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Second Chance Service Worker...');
    
    event.waitUntil(
        Promise.all([
            // Cache critical resources first
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] Caching critical recovery support resources...');
                return cache.addAll(CRITICAL_RESOURCES.concat(STATIC_RESOURCES));
            }),
            
            // Pre-cache crisis support data
            caches.open(API_CACHE).then((cache) => {
                console.log('[SW] Pre-caching crisis support data...');
                return cache.put('/api/crisis-resources', 
                    new Response(JSON.stringify(OFFLINE_CRISIS_DATA), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'max-age=86400' // 24 hours
                        }
                    })
                );
            })
        ]).then(() => {
            console.log('[SW] Second Chance Service Worker installed - Crisis support ready offline! 🛡️');
            self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Second Chance Service Worker...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName.includes('second-chance') && cacheName !== STATIC_CACHE && 
                        cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Second Chance Service Worker activated - Ready to support recovery! 💪');
            self.clients.claim();
        })
    );
});

// Fetch event - handle all network requests with recovery-focused strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-HTTP requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Handle API requests with special crisis support logic
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleAPIRequest(request));
        return;
    }
    
    // Handle static resources
    event.respondWith(handleStaticRequest(request));
});

// Handle API requests with crisis support priority
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    const isCrisisAPI = url.pathname === '/api/crisis-resources';
    
    try {
        // Always try network first for real-time data
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            if (CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
                const cache = await caches.open(API_CACHE);
                cache.put(request, networkResponse.clone());
            }
            
            return networkResponse;
        }
        
        throw new Error(`Network response not ok: ${networkResponse.status}`);
        
    } catch (error) {
        console.log(`[SW] Network failed for ${url.pathname}, trying cache...`);
        
        // For crisis resources, always provide offline data if network fails
        if (isCrisisAPI) {
            return new Response(JSON.stringify(OFFLINE_CRISIS_DATA), {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Offline-Response': 'true',
                    'Cache-Control': 'no-cache'
                }
            });
        }
        
        // Try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add offline indicator header
            const modifiedResponse = cachedResponse.clone();
            modifiedResponse.headers.set('X-Offline-Response', 'true');
            return modifiedResponse;
        }
        
        // Return offline fallback for other APIs
        return new Response(JSON.stringify({
            error: 'Offline',
            message: 'This feature is not available offline, but crisis support is always available',
            crisis_support: {
                phone: '988 - Suicide Prevention Lifeline',
                text: '741741 - Crisis Text Line (Text HOME)',
                offline: 'These numbers work without internet connection'
            },
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'X-Offline-Response': 'true'
            }
        });
    }
}

// Handle static resource requests
async function handleStaticRequest(request) {
    try {
        // Try cache first for static resources (cache-first strategy)
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response for future use
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log(`[SW] Failed to fetch ${request.url}, serving offline fallback...`);
        
        // Try to serve from cache one more time
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Serve offline HTML for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/dashboard.html') || caches.match('/index.html');
        }
        
        // Return offline response for other requests
        return new Response('Offline - Crisis support: Call 988 or text 741741', {
            status: 503,
            headers: {
                'Content-Type': 'text/plain',
                'X-Offline-Response': 'true'
            }
        });
    }
}

// Background sync for recovery data
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    if (event.tag === 'recovery-data-sync') {
        event.waitUntil(syncRecoveryData());
    }
    
    if (event.tag === 'crisis-resources-update') {
        event.waitUntil(updateCrisisResources());
    }
});

// Sync recovery data when back online
async function syncRecoveryData() {
    try {
        console.log('[SW] Syncing recovery data in background...');
        
        // Sync monitored apps
        const appsResponse = await fetch('/api/monitored-apps');
        if (appsResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put('/api/monitored-apps', appsResponse.clone());
        }
        
        // Sync admin requests
        const requestsResponse = await fetch('/api/admin-requests');
        if (requestsResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put('/api/admin-requests', requestsResponse.clone());
        }
        
        console.log('[SW] Recovery data sync completed successfully');
        
        // Notify all clients that data is updated
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'DATA_SYNCED',
                timestamp: new Date().toISOString()
            });
        });
        
    } catch (error) {
        console.error('[SW] Recovery data sync failed:', error);
    }
}

// Update crisis resources
async function updateCrisisResources() {
    try {
        console.log('[SW] Updating crisis resources...');
        
        const response = await fetch('/api/crisis-resources');
        if (response.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put('/api/crisis-resources', response.clone());
            console.log('[SW] Crisis resources updated successfully');
        }
        
    } catch (error) {
        console.error('[SW] Crisis resources update failed:', error);
        // Crisis resources failure is critical - always ensure offline data is available
        const cache = await caches.open(API_CACHE);
        cache.put('/api/crisis-resources', 
            new Response(JSON.stringify(OFFLINE_CRISIS_DATA), {
                headers: { 'Content-Type': 'application/json' }
            })
        );
    }
}

// Handle push notifications for recovery support
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'Second Chance recovery support notification',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            data: data,
            actions: [
                {
                    action: 'view',
                    title: 'View Dashboard'
                },
                {
                    action: 'crisis',
                    title: 'Crisis Support'
                }
            ],
            requireInteraction: data.priority === 'high',
            silent: false
        };
        
        // Special handling for crisis notifications
        if (data.type === 'crisis' || data.priority === 'critical') {
            options.requireInteraction = true;
            options.vibrate = [300, 100, 300, 100, 300];
            options.body = 'Crisis support notification - ' + (data.body || 'Help is available');
        }
        
        event.waitUntil(
            self.registration.showNotification('Second Chance Recovery Support', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'crisis') {
        // Open crisis resources
        event.waitUntil(
            clients.openWindow('/dashboard.html#crisis')
        );
    } else if (event.action === 'view') {
        // Open main dashboard
        event.waitUntil(
            clients.openWindow('/dashboard.html')
        );
    } else {
        // Default action - open dashboard
        event.waitUntil(
            clients.openWindow('/dashboard.html')
        );
    }
});

// Error handling for service worker
self.addEventListener('error', (event) => {
    console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Service Worker unhandled rejection:', event.reason);
});

console.log('[SW] Second Chance Service Worker loaded - Professional recovery support with offline crisis resources! 🛡️');

// 🤖 Generated with Claude Code
// Professional PWA service worker for addiction recovery support system