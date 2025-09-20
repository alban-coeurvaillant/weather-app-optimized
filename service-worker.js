// Service Worker pour l'application météo
const CACHE_NAME = 'weather-app-v1.2';
const STATIC_CACHE_NAME = 'weather-app-static-v1.2';
const DYNAMIC_CACHE_NAME = 'weather-app-dynamic-v1.2';

// Fichiers à mettre en cache lors de l'installation
const STATIC_FILES = [
    './',
    './app.html',
    './styles.css',
    './script.js',
    './manifest.json'
];

// URLs à ne jamais mettre en cache
const NEVER_CACHE = [
    '/api/analytics',
    '/api/tracking'
];

// Stratégies de cache
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installation en cours...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Mise en cache des fichiers statiques');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Installation terminée');
                return self.skipWaiting(); // Active immédiatement le nouveau SW
            })
            .catch(error => {
                console.error('Service Worker: Erreur lors de l\'installation:', error);
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activation en cours...');
    
    event.waitUntil(
        // Nettoyage des anciens caches
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => 
                            name.startsWith('weather-app-') && 
                            name !== STATIC_CACHE_NAME && 
                            name !== DYNAMIC_CACHE_NAME
                        )
                        .map(name => {
                            console.log('Service Worker: Suppression du cache obsolète:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation terminée');
                return self.clients.claim(); // Prend le contrôle immédiatement
            })
    );
});

// Interception des requêtes réseau
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorer les requêtes non-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Ignorer certaines URLs
    if (NEVER_CACHE.some(pattern => request.url.includes(pattern))) {
        return;
    }
    
    event.respondWith(handleRequest(request));
});

// Gestion intelligente des requêtes
async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Stratégie pour les fichiers statiques (HTML, CSS, JS)
        if (isStaticFile(request)) {
            return await cacheFirst(request, STATIC_CACHE_NAME);
        }
        
        // Stratégie pour les données dynamiques (API, etc.)
        if (isDynamicContent(request)) {
            return await networkFirstWithFallback(request);
        }
        
        // Stratégie par défaut: réseau avec cache en secours
        return await networkFirst(request, DYNAMIC_CACHE_NAME);
        
    } catch (error) {
        console.error('Service Worker: Erreur lors du traitement de la requête:', error);
        return await getCachedResponseOrFallback(request);
    }
}

// Vérifier si c'est un fichier statique
function isStaticFile(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    return pathname.endsWith('.html') ||
           pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.json') ||
           pathname === '/' || 
           pathname === './';
}

// Vérifier si c'est du contenu dynamique
function isDynamicContent(request) {
    return request.url.includes('/api/') ||
           request.url.includes('weather') ||
           request.url.includes('forecast');
}

// Stratégie Cache First
async function cacheFirst(request, cacheName = STATIC_CACHE_NAME) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        console.log('Service Worker: Réponse depuis le cache:', request.url);
        
        // Mise à jour en arrière-plan pour les fichiers statiques
        fetchAndUpdateCache(request, cacheName).catch(console.warn);
        
        return cachedResponse;
    }
    
    // Si pas en cache, récupérer du réseau
    return await fetchAndCache(request, cacheName);
}

// Stratégie Network First
async function networkFirst(request, cacheName = DYNAMIC_CACHE_NAME) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // Mettre en cache la réponse réussie
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone()).catch(console.warn);
            console.log('Service Worker: Réponse depuis le réseau (mise en cache):', request.url);
        }
        
        return response;
    } catch (error) {
        // En cas d'échec réseau, utiliser le cache
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('Service Worker: Réponse depuis le cache (échec réseau):', request.url);
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stratégie Network First avec page de fallback
async function networkFirstWithFallback(request) {
    try {
        return await networkFirst(request);
    } catch (error) {
        // Si c'est une requête de navigation et qu'on est hors ligne
        if (request.mode === 'navigate') {
            const cache = await caches.open(STATIC_CACHE_NAME);
            const fallback = await cache.match('./app.html');
            if (fallback) {
                return fallback;
            }
        }
        
        throw error;
    }
}

// Récupérer et mettre en cache
async function fetchAndCache(request, cacheName) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone()).catch(console.warn);
            console.log('Service Worker: Nouvelle ressource mise en cache:', request.url);
        }
        
        return response;
    } catch (error) {
        console.warn('Service Worker: Impossible de récupérer:', request.url, error);
        throw error;
    }
}

// Mise à jour en arrière-plan
async function fetchAndUpdateCache(request, cacheName) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, response);
            console.log('Service Worker: Cache mis à jour en arrière-plan:', request.url);
        }
    } catch (error) {
        console.warn('Service Worker: Échec de la mise à jour en arrière-plan:', error);
    }
}

// Obtenir une réponse en cache ou une page de fallback
async function getCachedResponseOrFallback(request) {
    // Essayer de trouver dans tous les caches
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('Service Worker: Réponse de fallback trouvée dans:', cacheName);
            return cachedResponse;
        }
    }
    
    // Si c'est une requête de navigation, retourner la page principale
    if (request.mode === 'navigate') {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const fallback = await cache.match('./app.html');
        
        if (fallback) {
            console.log('Service Worker: Page de fallback utilisée');
            return fallback;
        }
    }
    
    // Réponse d'erreur personnalisée
    return new Response(
        JSON.stringify({
            error: 'Contenu non disponible hors ligne',
            message: 'Cette ressource n\'est pas disponible sans connexion internet.'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

// Gestion des messages depuis l'application principale
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        case 'UPDATE_CACHE':
            if (payload && payload.urls) {
                updateCacheUrls(payload.urls).then(() => {
                    event.ports[0].postMessage({ success: true });
                });
            }
            break;
            
        default:
            console.warn('Service Worker: Type de message non reconnu:', type);
    }
});

// Nettoyage de tous les caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames
            .filter(name => name.startsWith('weather-app-'))
            .map(name => caches.delete(name))
    );
    console.log('Service Worker: Tous les caches ont été nettoyés');
}

// Mise à jour de URLs spécifiques dans le cache
async function updateCacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    const updatePromises = urls.map(async url => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log('Service Worker: URL mise à jour dans le cache:', url);
            }
        } catch (error) {
            console.warn('Service Worker: Impossible de mettre à jour:', url, error);
        }
    });
    
    await Promise.all(updatePromises);
}

// Gestion des notifications push (pour les futures fonctionnalités)
self.addEventListener('push', event => {
    if (!event.data) return;
    
    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'Nouvelle information météo disponible',
            icon: './icon-192.png',
            badge: './icon-72.png',
            tag: 'weather-update',
            renotify: true,
            requireInteraction: false,
            actions: [
                {
                    action: 'view',
                    title: 'Voir la météo',
                    icon: './icon-72.png'
                },
                {
                    action: 'dismiss',
                    title: 'Ignorer'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Météo Française',
                options
            )
        );
    } catch (error) {
        console.error('Service Worker: Erreur lors du traitement de la notification:', error);
    }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('./app.html')
        );
    }
});

console.log('Service Worker: Chargé et prêt!');