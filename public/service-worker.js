// public/service-worker.js

// This event runs when the service worker is first installed.
self.addEventListener('install', (event) => {
    // skipWaiting() forces the waiting service worker to become the
    // active service worker.
    self.skipWaiting();
    console.log('Service worker installed');
});

// This event runs when the service worker activates.
self.addEventListener('activate', (event) => {
    // clients.claim() allows an active service worker to set itself as the
    // controller for all clients within its scope.
    event.waitUntil(clients.claim());
    console.log('Service worker activated');
});


// This event handles clicks on notifications.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a window for the app is already open, focus it
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                // Navigate the client to the chat page before focusing
                client.navigate('/chat');
                return client.focus();
            }
            // Otherwise, open a new window to the chat page
            return clients.openWindow('/chat');
        })
    );
});