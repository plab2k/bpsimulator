'use strict';

var version = '#version';
const sources = ['#sources'];

self.addEventListener('install', function(e) {
    const rnd = Math.random().toString(36).substring(7);
    e.waitUntil(
        caches.open(version).then(function(cache) {
            return cache.addAll([
                '/run/?' + rnd,
                '/run/demos/1.json?' + rnd,
                '/run/manifest.json',
                '/favicon.ico'
            ].concat(sources));
        })
        .then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        /* fetch(e.request).catch(function() {
            return caches.match(e.request, { ignoreSearch: true });
        }) */
        caches.match(e.request, { ignoreSearch: true }).then(function(response) {
            return response || fetch(e.request);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName != version;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
    //return self.clients.claim();
});

self.addEventListener('message', (event) => {
    const logTableName = "task";
    let request;
    if (!event.data || !event.data.action) {
        return;
    }
    const message = event.data;

    switch (message.action) {
        case 'force-activate':
            self.skipWaiting();
            self.clients.claim();
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => client.postMessage('reload-window'));
            });
            break;
        case 'addLogTask':
            request = indexedDB.open('logs');
            request.onsuccess = function(event) {
                const db = event.target.result;
                const store = db.transaction(db.objectStoreNames, "readwrite").objectStore(logTableName);
                store.add(message.value);
                store.transaction.complete;
                db.close();
            };
            break;
        case 'clearLogTask':
            request = indexedDB.open('logs');
            request.onsuccess = function(event) {
                const db = event.target.result;
                const store = db.transaction(db.objectStoreNames, "readwrite").objectStore(logTableName);
                store.clear();
                store.transaction.complete;
                db.close();
            };
            break;
        default:
            // NOOP
            break;
    }
});